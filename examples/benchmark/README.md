# benchmark

This project does benchmark of object marshalling into DynamoDB atributes between ts-dynamodb-attributes-transformer and [kayomarz/dynamodb-data-types](https://github.com/kayomarz/dynamodb-data-types).

## How to run

```
npm ci
npm run bench
```

## Example result

```
node version: v16.17.0
dynamodb-data-types marshalling x 3,475,450 ops/sec ±0.45% (96 runs sampled)
ts-dynamodb-attributes-transformer marshalling x 13,405,409 ops/sec ±0.43% (91 runs sampled)
Fastest is ts-dynamodb-attributes-transformer marshalling
```

