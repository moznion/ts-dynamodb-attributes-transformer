const Benchmark = require('benchmark');
const toDynamoDBRecordByDataTypes = require('./dynamodb_data_types');
const toDynamoDBRecordByTransformer = require('./using_transformer').toDynamoDBRecord;

console.log(`node version: ${process.version}`);
new Benchmark.Suite()
  .add('dynamodb-data-types marshalling', function () {
    toDynamoDBRecordByDataTypes();
  })
  .add('ts-dynamodb-attributes-transformer marshalling', function () {
    toDynamoDBRecordByTransformer();
  })
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
