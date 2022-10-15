import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly m: Map<RegExp, string>) {}
}

dynamodbRecord<Clazz>(new Clazz(new Map()));
