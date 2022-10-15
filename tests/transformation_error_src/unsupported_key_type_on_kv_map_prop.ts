import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly m: { [key: symbol]: string }) {}
}

dynamodbRecord<Clazz>(new Clazz({}));
