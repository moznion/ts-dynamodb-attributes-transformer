import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly regexpMap: Map<string, RegExp>) {}
}

dynamodbRecord<Clazz>(new Clazz(new Map()));
