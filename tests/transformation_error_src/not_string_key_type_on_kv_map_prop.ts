import { dynamodbRecord } from '../../index';

class Clazz {
  constructor(readonly m: { [key: number]: string }) {}
}

dynamodbRecord<Clazz>(new Clazz({}));
