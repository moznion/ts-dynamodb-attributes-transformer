# ts-dynamodb-attributes-transformer [![.github/workflows/check.yml](https://github.com/moznion/ts-dynamodb-attributes-transformer/actions/workflows/check.yml/badge.svg)](https://github.com/moznion/ts-dynamodb-attributes-transformer/actions/workflows/check.yml)

Code transformer plugin for Amazon DynamoDB attributes powered by [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API).

## How it works

This plugin replaces the TypeScript function invocation of `dynamodbRecord<T>(obj: T)` with `Record<string, AttributeValue>` value that is defined in aws-sdk-js-v3 according to the type `T` and the contents of the object. In short, this plugin generates the DynamoDB attribute code for every property of type `T`.

This plugin powers the users can do drop-in replacements for the existing `Record<string, AttributeValue>` value and/or the generator with `dynamodbRecord<T>(obj: T)` function.

Manual making the translation layer between the object and DynamoDB's Record is no longer needed!

## Motivations

- To do automatic generation of the [DynamoDB attribute data type](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html) code that is recognizable by [aws-sdk-js-v3](https://github.com/aws/aws-sdk-js-v3), with type safety.
- Performance. This uses TypeScript Compiler API, so it generates/determine the DynamoDB attribute code at the compiling timing. This means the logic doesn't have to do a reflection on the fly so this contributes to a good performance.

## Synopsis

```ts
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { dynamodbRecord } from '@moznion/ts-dynamodb-attributes-transformer';

interface User {
  readonly id: number;
  readonly name: string;
  readonly tags: Map<string, string>;
}

const record: Record<string, AttributeValue> = dynamodbRecord<User>({
  id: 12345,
  name: 'John Doe',
  tags: new Map<string, string>([
    ['foo', 'bar'],
    ['buz', 'qux'],
  ]),
});

/*
 * Then you can use this record value on the aws-sdk-js-v3's DynamoDB client; for example,
 * 
 *   const dyn = new DynamoDBClient(...);
 *   await dyn.send(new PutItemCommand({
 *     TableName: "...",
 *     Item: record, // <= HERE!
 *   }));
 */
```

Then this plugin transforms the above TypeScript code like the following JavaScript code:

```js
const record = function () {
    var arg;
    arg = {
        id: 12345,
        name: 'John Doe',
        tags: new Map([
            ['foo', 'bar'],
            ['buz', 'qux'],
        ]),
    }
    return {
        id: {
            N: arg.id.toString()
        },
        name: {
            S: arg.name
        },
        tags: {
            M: function () {
                var m;
                m = {}
                for (const kv of arg.tags) {
                    m[kv[0]] = { S: kv[1] }
                }
                return m;
            }()
        }
    };
}();
/*
 * This record is equal to the following object:
 * 
 *   {
 *     id: { N: "12345" },
 *     name: { S: "John Doe" },
 *     tags: {
 *       M: {
 *         foo: { S: "bar" },
 *         buz: { S: "qux" }
 *       }
 *     }
 *   }
 */
```

## How to use this transformer

This plugin exports a function that has the signature `dynamodbRecord<T extends object>(item: T): Record<string, AttributeValue>`.

This function is a marker to indicate to the transformer to replace this function invocation with the generated DynamoDB record code. Therefore, there are some restrictions: 

- Type parameter `T` is mandatory parameter (i.e. this mustn't be omitted). A transformer analyzes the type of the given `T` to collect the property information. 
- Type `T` must be class or interface.

### Examples

#### ttypescript

[ttypescript](https://github.com/cevek/ttypescript) is a custom TypeScript compiler that triggers the specified transformers in the tsconfig.json.

Please refer to the [examples/ttypescript](./examples/ttypescript) project directory and [ttypescript official README](https://github.com/cevek/ttypescript) for more details.

Anyway, the important thing is specifying `compilerOptions.plugins` in tsconfig.json like the following:

```json
{
  "compilerOptions": {
    // ...
    "plugins": [
      { "transform": "@moznion/ts-dynamodb-attributes-transformer/transformer" }
    ]
  },
  // ...
}
```

#### ts-jest

If you use [ts-jest](https://github.com/kulshekhar/ts-jest) with this transformer, one of the easiest ways is using that with ttypescript toghether.

It needs ttypescript configuration and additionally the jest configuration in `jest.config.js` like the below:

```js
module.exports = {
  // ...
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        compiler: 'ttypescript',
      },
    ],
  },
  // ...
};

```

## TypeScript types to DynamoDB types

Please see also [Supported data types and naming rules in Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html) for more details about the DynamoDB types.

### Scalar Types

| TypeScript     | DynamoDB   |
|----------------|------------|
| number, BigInt | N          |
| string         | S          |
| Uint8Array     | B          |
| boolean        | BOOL       |
| unknown        | NULL       |

NOTE: if the TypeScript property has `unknown` type and the value is `null` then DynamoDB attribute becomes `{ NULL: true }`. Else, that attribute value is `{ NULL: false }`.

### Document Types

| TypeScript                                                     | DynamoDB |
|----------------------------------------------------------------|----------|
| `Set<string>`                                                  | SS       |
| `Set<number>`, `Set<BigInt>`                                   | NS       |
| `Set<Uint8Array>`                                              | BS       |
| `List<$SCALAR_TYPE>`                                           | L        |
| `Map<string, $SCALAR_TYPE>`, `{ [key: string]: $SCALAR_TYPE }` | M        |

## Options

### `TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK` env var (default: `<empty>`)

By default, if this plugin encounters unsupported types, it raises the error and halts the transformation.

But if `TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK` environment variable is not empty, it proceeds the transformation with ignoring the unsupported typed property even if it gets the unsupported types.

## Note

This transformer plugin referred to the various things from [kimamula/ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys)

## Authors

moznion (<moznion@mail.moznion.net>)
