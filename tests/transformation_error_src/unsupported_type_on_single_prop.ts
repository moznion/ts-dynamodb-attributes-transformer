import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly regex: RegExp) {}
}

dynamodbRecord<Clazz>(new Clazz(/re/));
