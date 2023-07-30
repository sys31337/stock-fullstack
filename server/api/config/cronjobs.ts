import Agenda from 'agenda';
import axios from 'axios';
import { Types } from 'mongoose';
import { log } from '../utils';

const DATABASEURI = process.env.DATABASEURI as string;

const agenda = new Agenda({ db: { address: DATABASEURI } });

const holder = async (isDaily?: boolean) => {
  log('Hello');
};

agenda.define('Dev Check challenges', async () => {
  holder();
});


const checkChallenges = async () => {
  await agenda.start();

  await agenda.cancel({ name: 'Dev Check challenges' });
  await agenda.every('365 days', 'Dev Check challenges');
};

export default checkChallenges;
