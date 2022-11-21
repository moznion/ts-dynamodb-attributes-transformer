# ts-dynamodb-attributes-transformer [![.github/workflows/check.yml](https://github.com/moznion/ts-dynamodb-attributes-transformer/actions/workflows/check.yml/badge.svg)](https://github.com/moznion/ts-dynamodb-attributes-transformer/actions/workflows/check.yml) [![npm version](https://badge.fury.io/js/@moznion%2Fts-dynamodb-attributes-transformer.svg)](https://badge.fury.io/js/@moznion%2Fts-dynamodb-attributes-transformer)

Code transformer plugin powered by [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) that transforms TypeScript object from/to Amazon DynamoDB attributes.

## Description

This plugin replaces the TypeScript function invocation with the generated object code. In short, this plugin generates the code for every property of type `T`.


### `dynamodbRecord<T>(obj: T, shouldLenientTypeCheck?: boolean): Record<keyof T, AttributeValue>`

This plugin replaces `dynamodbRecord<T>(obj: T)` invocation with `Record<keyof T, AttributeValue>` value that is defined in aws-sdk-js-v3 according to the type `T` and the contents of the object.

This plugin powers the users can do drop-in replacements for the existing `Record<keyof T, AttributeValue>` value and/or the generator with `dynamodbRecord<T>(obj: T)` function.

### `fromDynamodbRecord<T>(attrs: Record<string, AttributeValue>, shouldLenientTypeCheck?: boolean): T`

This replaces `fromDynamodbRecord<T>(attrs: Record<string, AttributeValue>)` invocation with the object which has type `T`. This method is responsible to translate the DynamoDB attributes to the actual TypeScript object, i.e. unmarshalling.

## Motivations

- To do automatic generation of the [DynamoDB attribute data type](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html) code that is recognizable by [aws-sdk-js-v3](https://github.com/aws/aws-sdk-js-v3), with type safety.
  - Manual making the translation layer between the object and DynamoDB's Record is no longer needed!
- Performance. This uses TypeScript Compiler API, so it generates/determine the DynamoDB attribute code at the compiling timing. This means the logic doesn't have to do a reflection on the fly so this contributes to a good performance.

### Benchmark

The benchmark result between this project and [kayomarz/dynamodb-data-types](https://github.com/kayomarz/dynamodb-data-types) is the following:

marshalling:

```
node version: v16.17.0
dynamodb-data-types marshalling x 3,845,247 ops/sec ±0.63% (90 runs sampled)
ts-dynamodb-attributes-transformer marshalling x 13,614,974 ops/sec ±0.24% (100 runs sampled)
Fastest is ts-dynamodb-attributes-transformer marshalling
```

unmarshalling:

```
node version: v16.17.0
dynamodb-data-types unmarshalling x 1,800,718 ops/sec ±0.30% (96 runs sampled)
ts-dynamodb-attributes-transformer unmarshalling x 3,493,272 ops/sec ±0.50% (98 runs sampled)
Fastest is ts-dynamodb-attributes-transformer unmarshalling
```

Please see also [benchmark](./examples/benchmark) project.

## Synopsis

### Marshalling into DynamoDB record from the Typescript Object

```ts
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { dynamodbRecord } from '@moznion/ts-dynamodb-attributes-transformer';

interface User {
  readonly id: number;
  readonly name: string;
  readonly tags: Map<string, string>;
}

const record: Record<keyof User, AttributeValue> = dynamodbRecord<User>({
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
const record = (function (arg) {
  return {
    id: {
      N: arg.id.toString()
    },
    name: {
      S: arg.name
    },
    tags: {
      M: (function () {
        var m;
        m = {}
        for (const kv of arg.tags) {
          m[kv[0]] = { S: kv[1] }
        }
        return m;
      })()
    }
  };
})({
  id: 12345,
  name: 'John Doe',
  tags: new Map([
    ['foo', 'bar'],
    ['buz', 'qux'],
  ]),
});
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

### Unmarshalling into TypeScript object from DynamoDB record

```ts
import { fromDynamodbRecord } from '@moznion/ts-dynamodb-attributes-transformer';

interface User {
  readonly id?: number;
  readonly name?: string;
  readonly tags: Map<string, string>;
}

const user: User = fromDynamodbRecord<User>({
  id: {
    N: '12345',
  },
  name: {
    S: 'John Doe',
  },
  tags: {
    M: {
      foo: {
        S: 'bar',
      },
      buz: {
        S: 'qux',
      },
    },
  },
});
```

Then this plugin transforms the above TypeScript code like the following JavaScript code:

```js
const user = (function (arg) {
  return {
    id: (function () {
      const numStr = arg.id.N;
      return numStr === undefined ? undefined : Number(numStr);
    })(),
    name: arg.name.S,
    tags: (function () {
      var m, r;
      m = new Map();
      r = arg['tags']?.M;
      for (const k in r) {
        m.set(k, r[k]?.S);
      }
      return m;
    })(),
  };
})({
  id: {
    N: '12345',
  },
  name: {
    S: 'John Doe',
  },
  tags: {
    M: {
      foo: {
        S: 'bar',
      },
      buz: {
        S: 'qux',
      },
    },
  },
});

/*
 * This object is equal to the following:
 *
 *   {
 *     id: 12345,
 *     name: "John Doe",
 *     tags: {
 *       foo: { S: "bar" },
 *       buz: { S: "qux" },
 *     }
 *   }
 */
```

## How to use this transformer

This plugin exports the functions that have the signature `function dynamodbRecord<T extends object>(item: T, shouldLenientTypeCheck?: boolean): Record<keyof T, AttributeValue>` and `function fromDynamodbRecord<T extends object>(attrs: Record<string, AttributeValue>, shouldLenientTypeCheck?: boolean): T`.

These functions are the markers to indicate to the transformer to replace the function invocation with the generated code. Therefore, there are some restrictions:

- Type parameter `T` is mandatory parameter (i.e. this mustn't be omitted). A transformer analyzes the type of the given `T` to collect the property information.
- Type `T` must be class or interface. If it needs to do unmarshalling, this type `T` must be a derived type of the **interface**.

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

### Lenient type checking (default: `false`)

By default, if this plugin encounters unsupported types, it raises the error and halts the transformation.

But if `true` value is given through the second argument of the function, it proceeds the transformation with ignoring the unsupported typed property even if it gets the unsupported types.

## Note

This transformer plugin referred to the various things from [kimamula/ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys)

## Authors

moznion (<moznion@mail.moznion.net>)
