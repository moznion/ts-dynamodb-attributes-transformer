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

function fromDynamoDBRecord() {
  AttributeValue.unwrap({
    id: {
      N: '123455',
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
    flags: {
      SS: ['foo', 'bar'],
    },
  });
}

module.exports.toDynamoDBRecord = toDynamoDBRecord;
module.exports.fromDynamoDBRecord = fromDynamoDBRecord;
