import { describe, expect, test } from '@jest/globals';
import * as child_process from 'child_process';
import { ExecException } from 'child_process';

describe('dynamodb record transformation errors', () => {
  test('should raise error when the type parameter is missing', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/no_type_parameter.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(
      /Error: No type argument on dynamodbRecord\(\)\. Please put a type argument on the function/,
    );
  });

  test('should raise error when the argument is missing', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/no_arg.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(
      /Error: No argument on dynamodbRecord\(\)\. Please put an argument that has Clazz type on the function/,
    );
  });

  test('should raise error when the single property has unsupported type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_type_on_single_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a property "regex" of the type "Clazz" has unsupported type/);
  });

  test('should raise error when the array property has unsupported type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_type_on_array_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a property "regexps" of the type "Clazz" has unsupported type/);
  });

  test('should raise error when the set property has unsupported type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_type_on_set_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a property "regexpSet" of the type "Clazz" has unsupported type/);
  });

  test('should raise error when the map property has unsupported value type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_value_type_on_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a property "regexpMap" of the type "Clazz" has unsupported type/);
  });

  test('should raise error when the map property has non-string key type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/not_string_key_type_on_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a Map type property "m" has non-string key type/);
  });

  test('should raise error when the map property has unsupported key type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_key_type_on_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/a Map type property "m" of the type "Clazz" has non-string key type/);
  });

  test('should raise error when the KV map property has unsupported value type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_value_type_on_kv_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a property "regexpKVMap" of the type "Clazz" has unsupported type/);
  });

  test('should raise error when the KV map property has non-string key type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/not_string_key_type_on_kv_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/Error: a Map type property "m" has non-string key type/);
  });

  test('should raise error when the KV map property has unsupported key type', async () => {
    const err = await new Promise<ExecException | null>(resolve => {
      child_process.exec(
        'NODE_NO_WARNINGS=true TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK= npx ts-node -C ttypescript ./tests/transformation_error_src/unsupported_key_type_on_kv_map_prop.ts',
        err => {
          resolve(err);
        },
      );
    });

    expect(err).not.toBeNull();
    expect(err?.message).toMatch(/a Map type property "m" of the type "Clazz" has non-string key type/);
  });
});
