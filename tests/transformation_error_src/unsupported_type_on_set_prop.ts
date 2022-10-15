import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly regexpSet: Set<RegExp>) {}
}

dynamodbRecord<Clazz>(new Clazz(new Set([/re/])));
