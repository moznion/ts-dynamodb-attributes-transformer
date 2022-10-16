import ts from 'typescript';
import path from 'path';
import {
  DynamodbPrimitiveTypes,
  dynamodbPrimitiveTypeFromTypeFlag,
  dynamodbPrimitiveTypeFromName,
} from './lib/dynamodb_primitive_types';
import {
  ArrayField,
  DynamodbItemField,
  KeyValuePairMapField,
  MapField,
  PrimitiveField,
  SetField,
} from './lib/dynamodb_item_field';
import { warn } from './lib/logger';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

const dynamodbRecordFuncName = 'dynamodbRecord';
const shouldLenientTypeCheck = !!process.env['TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK'];

function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.SourceFile;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node | undefined;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node | undefined {
  return ts.visitEachChild(
    visitNode(node, program),
    childNode => visitNodeAndChildren(childNode, program, context),
    context,
  );
}

function visitNode(node: ts.SourceFile, program: ts.Program): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined {
  const typeChecker = program.getTypeChecker();
  if (isDynamodbRecordImportExpression(node)) {
    // remove import expression from transformed code
    return undefined;
  }

  if (!isDynamodbRecordCallExpression(node, typeChecker)) {
    return node;
  }

  if (node.typeArguments === undefined || node.typeArguments.length !== 1 || !node.typeArguments[0]) {
    throw new Error(`No type argument on ${dynamodbRecordFuncName}(). Please put a type argument on the function`);
  }

  const typeName = node.typeArguments[0].getText();

  if (node.arguments.length !== 1 || !node.arguments[0]) {
    throw new Error(
      `No argument on ${dynamodbRecordFuncName}(). Please put an argument that has ${typeName} type on the function`,
    );
  }

  const argVarNameIdent = ts.factory.createIdentifier('arg');
  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
  const properties = typeChecker.getPropertiesOfType(type);
  const objectProps = properties
    .map((prop): DynamodbItemField | undefined => {
      if (
        !prop.valueDeclaration ||
        !ts.canHaveModifiers(prop.valueDeclaration) ||
        !isPropertyModifierInArgumentSuitableForDynamodbAttr(ts.getModifiers(prop.valueDeclaration))
      ) {
        // skip it
        return undefined;
      }

      const propName = prop.name;

      if (
        prop.valueDeclaration.kind !== ts.SyntaxKind.Parameter &&
        prop.valueDeclaration.kind !== ts.SyntaxKind.PropertySignature
      ) {
        const msg = `a property "${propName}" of the type "${typeName}" doesn't have parameter kind; maybe the ${typeName} is not class of interface`;
        if (shouldLenientTypeCheck) {
          warn(msg);
          return undefined;
        }
        throw new Error(msg);
      }

      const valueDeclSymbol = typeChecker.getTypeAtLocation(prop.valueDeclaration).symbol;
      const valueDeclSymbolName = valueDeclSymbol?.name;

      if (valueDeclSymbolName === 'Array') {
        const typeArgs = typeChecker.getTypeArguments(
          typeChecker.getTypeAtLocation(prop.valueDeclaration) as ts.TypeReference,
        );
        const valueType = dynamodbPrimitiveTypeFromTypeFlag(typeArgs[0]?.flags);
        if (valueType === undefined) {
          const valueTypeName = typeArgs[0]?.symbol?.name;
          if (valueTypeName === 'Uint8Array') {
            return new ArrayField(propName, DynamodbPrimitiveTypes.Binary);
          }
          if (valueTypeName === 'BigInt') {
            return new ArrayField(propName, DynamodbPrimitiveTypes.Number);
          }

          const msg = `a property "${propName}" of the type "${typeName}" has unsupported type: "${valueTypeName}"`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }
        return new ArrayField(propName, valueType);
      }
      if (valueDeclSymbolName == 'Set') {
        const typeArgs = typeChecker.getTypeArguments(
          typeChecker.getTypeAtLocation(prop.valueDeclaration) as ts.TypeReference,
        );
        const valueType = dynamodbPrimitiveTypeFromTypeFlag(typeArgs[0]?.flags);
        if (valueType === undefined) {
          const valueTypeName = typeArgs[0]?.symbol?.name;
          if (valueTypeName === 'Uint8Array') {
            return new SetField(propName, DynamodbPrimitiveTypes.Binary, shouldLenientTypeCheck);
          }
          if (valueTypeName === 'BigInt') {
            return new SetField(propName, DynamodbPrimitiveTypes.Number, shouldLenientTypeCheck);
          }

          const msg = `a property "${propName}" of the type "${typeName}" has unsupported type: ${valueTypeName}`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }
        return new SetField(propName, valueType, shouldLenientTypeCheck);
      }
      if (valueDeclSymbolName == 'Map') {
        const typeArgs = typeChecker.getTypeArguments(
          typeChecker.getTypeAtLocation(prop.valueDeclaration) as ts.TypeReference,
        );

        const keyType = dynamodbPrimitiveTypeFromTypeFlag(typeArgs[0]?.flags);
        if (keyType === undefined) {
          const msg = `a Map type property "${propName}" of the type "${typeName}" has non-string key type`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }

        const valueType = dynamodbPrimitiveTypeFromTypeFlag(typeArgs[1]?.flags);
        if (valueType === undefined) {
          const valueTypeName = typeArgs[1]?.symbol?.name;
          if (valueTypeName === 'Uint8Array') {
            return new MapField(propName, keyType, DynamodbPrimitiveTypes.Binary, shouldLenientTypeCheck);
          }
          if (valueTypeName === 'BigInt') {
            return new MapField(propName, keyType, DynamodbPrimitiveTypes.Number, shouldLenientTypeCheck);
          }

          const msg = `a property "${propName}" of the type "${typeName}" has unsupported type: "${valueTypeName}"`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }

        return new MapField(propName, keyType, valueType, shouldLenientTypeCheck);
      }
      if ((valueDeclSymbol?.flags & ts.SymbolFlags.TypeLiteral) === ts.SymbolFlags.TypeLiteral) {
        // for key-value pair map notation
        const kvType = extractKeyValueTypesFromKeyValuePairMapSyntax(prop.valueDeclaration.getChildren());

        const keyTypeName = kvType?.[0];
        const keyType = dynamodbPrimitiveTypeFromName(keyTypeName);
        if (keyType === undefined) {
          const msg = `a Map type property "${propName}" of the type "${typeName}" has non-string key type: "${keyTypeName}"`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }

        const valueTypeName = kvType?.[1];
        const valueType = dynamodbPrimitiveTypeFromName(valueTypeName);
        if (valueType === undefined) {
          const msg = `a property "${propName}" of the type "${typeName}" has unsupported type: "${valueTypeName}"`;
          if (shouldLenientTypeCheck) {
            warn(msg);
            return undefined;
          }
          throw new Error(msg);
        }

        return new KeyValuePairMapField(propName, keyType, valueType, shouldLenientTypeCheck);
      }

      // primitive types
      if (valueDeclSymbolName === 'Uint8Array') {
        return new PrimitiveField(propName, DynamodbPrimitiveTypes.Binary);
      }

      let colonTokenCame = false;
      for (const propNode of prop.valueDeclaration.getChildren()) {
        if (colonTokenCame) {
          const fieldType = dynamodbPrimitiveTypeFromName(propNode.getText());
          if (fieldType === undefined) {
            const msg = `a property "${propName}" of the type "${typeName}" has unsupported type: "${propNode.getText()}"`;
            if (shouldLenientTypeCheck) {
              warn(msg);
              return undefined;
            }
            throw new Error(msg);
          }
          return new PrimitiveField(propName, fieldType);
        }
        colonTokenCame = propNode.kind == ts.SyntaxKind.ColonToken;
      }

      // should never reach here

      const msg = `unexpected error: a property "${propName}" of the type "${typeName}" has unsupported type`;
      if (shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    })
    .map(field => {
      return field?.generateCode(argVarNameIdent.text);
    })
    .filter((c): c is ts.ObjectLiteralElementLike => !!c);

  return ts.factory.createImmediatelyInvokedFunctionExpression(
    [ts.factory.createReturnStatement(ts.factory.createObjectLiteralExpression(objectProps, true))] as ts.Statement[],
    ts.factory.createParameterDeclaration([], undefined, argVarNameIdent, undefined, node.typeArguments[0], undefined),
    node.arguments[0],
  );
}

function extractKeyValueTypesFromKeyValuePairMapSyntax(nodes: ts.Node[]): [string, string] | undefined {
  for (const node of nodes) {
    if (node.kind === ts.SyntaxKind.TypeLiteral && node.getChildCount() === 3) {
      const kvTypeDeclNode = node.getChildAt(1);
      if (kvTypeDeclNode.kind === ts.SyntaxKind.SyntaxList && kvTypeDeclNode.getChildCount() === 1) {
        const kvTypeSignatureNode = kvTypeDeclNode.getChildAt(0);
        if (kvTypeSignatureNode.kind === ts.SyntaxKind.IndexSignature && kvTypeSignatureNode.getChildCount() === 5) {
          const valueType = kvTypeSignatureNode.getChildAt(4).getText();

          const keyTypeDeclNode = kvTypeSignatureNode.getChildAt(1);
          if (keyTypeDeclNode.kind === ts.SyntaxKind.SyntaxList && keyTypeDeclNode.getChildCount() === 1) {
            const keyTypeSignatureNode = keyTypeDeclNode.getChildAt(0);
            if (keyTypeSignatureNode.kind === ts.SyntaxKind.Parameter && keyTypeSignatureNode.getChildCount() === 3) {
              return [keyTypeSignatureNode.getChildAt(2).getText(), valueType];
            }
          }
        }
      }
      break;
    }
  }
  return undefined;
}

function isPropertyModifierInArgumentSuitableForDynamodbAttr(modifiers: readonly ts.Modifier[] | undefined): boolean {
  if (modifiers === undefined) {
    return true;
  }
  return !modifiers.map(m => m.kind).includes(ts.SyntaxKind.PrivateKeyword);
}

const indexJs = path.join(__dirname, 'index.js');
function isDynamodbRecordImportExpression(node: ts.Node): node is ts.ImportDeclaration {
  if (!ts.isImportDeclaration(node)) {
    return false;
  }
  const module = (node.moduleSpecifier as ts.StringLiteral).text;
  try {
    return (
      indexJs ===
      (module.startsWith('.')
        ? require.resolve(path.resolve(path.dirname(node.getSourceFile().fileName), module))
        : require.resolve(module))
    );
  } catch (e) {
    return false;
  }
}

const indexTs = path.join(__dirname, 'index.d.ts');
function isDynamodbRecordCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const declaration = typeChecker.getResolvedSignature(node)?.declaration;
  if (!declaration || ts.isJSDocSignature(declaration) || declaration.name?.getText() !== dynamodbRecordFuncName) {
    return false;
  }
  try {
    // require.resolve is required to resolve symlink.
    // https://github.com/kimamula/ts-transformer-keys/issues/4#issuecomment-643734716
    return require.resolve(declaration.getSourceFile().fileName) === indexTs;
  } catch {
    // declaration.getSourceFile().fileName may not be in Node.js require stack and require.resolve may result in an error.
    // https://github.com/kimamula/ts-transformer-keys/issues/47
    return false;
  }
}
