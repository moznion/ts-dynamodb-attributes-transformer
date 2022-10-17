const AttributeValue = require('dynamodb-data-types').AttributeValue;

const obj = {
  id: 12345,
  name: 'John Doe',
  tags: {
    foo: 'bar',
    buz: 'qux',
  },
  flags: ['foo', 'bar'],
  nil: null,
};

function toDynamoDBRecord() {
  AttributeValue.wrap(obj);
}

module.exports = toDynamoDBRecord;
