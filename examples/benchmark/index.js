const Benchmark = require('benchmark');
const toDynamoDBRecordByDataTypes = require('./dynamodb_data_types').toDynamoDBRecord;
const fromDynamoDBRecordByDataTypes = require('./dynamodb_data_types').fromDynamoDBRecord;
const toDynamoDBRecordByTransformer = require('./using_transformer').toDynamoDBRecord;
const fromDynamoDBRecordByTransformer = require('./using_transformer').fromDynamoDBRecord;

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
  .run({ async: false });

new Benchmark.Suite()
  .add('dynamodb-data-types unmarshalling', function () {
    fromDynamoDBRecordByDataTypes();
  })
  .add('ts-dynamodb-attributes-transformer unmarshalling', function () {
    fromDynamoDBRecordByTransformer();
  })
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false });
