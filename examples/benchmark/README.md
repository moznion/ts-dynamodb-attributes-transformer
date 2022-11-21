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
dynamodb-data-types marshalling x 3,845,247 ops/sec ±0.63% (90 runs sampled)
ts-dynamodb-attributes-transformer marshalling x 13,614,974 ops/sec ±0.24% (100 runs sampled)
Fastest is ts-dynamodb-attributes-transformer marshalling
dynamodb-data-types unmarshalling x 1,800,718 ops/sec ±0.30% (96 runs sampled)
ts-dynamodb-attributes-transformer unmarshalling x 3,493,272 ops/sec ±0.50% (98 runs sampled)
Fastest is ts-dynamodb-attributes-transformer unmarshalling
```

