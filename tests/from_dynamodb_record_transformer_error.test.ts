import { describe, expect, test } from '@jest/globals';
import * as child_process from 'child_process';
import { ExecException } from 'child_process';

describe('from dynamodb record transformation errors', () => {
  test('should raise error when the type parameter is missing', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/from_dynamodb_record_transformer_error_src/no_type_parameter.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(
      /Error: No type argument on fromDynamodbRecord\(\)\. Please put a type argument on the function/,
    );
  });

  test('should raise error when the type parameter is class', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/from_dynamodb_record_transformer_error_src/class_type_parameter.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(
      /Error: A type parameter of fromDynamodbRecord\(\) must be interface, but Clazz is a class/,
    );
  });

  test('should raise error when the type parameter is not class and interface', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/from_dynamodb_record_transformer_error_src/object_literal_type_parameter.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(
      /Error: A type parameter of fromDynamodbRecord\(\) must be interface, but \{\} is not/,
    );
  });
});
