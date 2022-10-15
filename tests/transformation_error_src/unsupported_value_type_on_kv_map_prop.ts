import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly regexpKVMap: { [key: string]: RegExp }) {}
}

dynamodbRecord<Clazz>(new Clazz({}));
