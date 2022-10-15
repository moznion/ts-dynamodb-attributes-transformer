import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly regexps: RegExp[]) {}
}

dynamodbRecord<Clazz>(new Clazz([/re/]));
