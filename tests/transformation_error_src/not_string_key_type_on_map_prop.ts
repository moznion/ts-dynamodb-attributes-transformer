import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly m: Map<number, string>) {}
}

dynamodbRecord<Clazz>(new Clazz(new Map()));
