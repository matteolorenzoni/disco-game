/* eslint-disable @typescript-eslint/no-explicit-any */
import { Challenge } from '../model/challenge.model';
import { EventChallenge } from '../model/event-challenge.model';
import { Event } from '../model/event.model';
import { Doc } from '../model/firebase';
import { Team } from '../model/team.model';

export type MergeEvent = { id: string } & Pick<
  Event,
  'name' | 'description' | 'imageUrl' | 'location' | 'startDate'
> & { teamId: string | null };

export type MergeChallenge = { id: string } & Pick<
  Challenge,
  'name' | 'description' | 'rules' | 'type' | 'points' | 'complexity'
> &
  Pick<EventChallenge, 'eventId' | 'eventStartDate' | 'status' | 'maxTimes' | 'startDate' | 'endDate'>;

export const mergeEvents = (events: Doc<Event>[], teams: Doc<Team>[]): MergeEvent[] => {
  return events.reduce<MergeEvent[]>((acc, event) => {
    const matchingTeam = teams.find((team) => team.props.eventId === event.id);
    const mergedEvent: MergeEvent = {
      id: event.id,
      description: event.props.description,
      name: event.props.name,
      imageUrl: event.props.imageUrl,
      location: event.props.location,
      startDate: event.props.startDate,
      teamId: matchingTeam ? matchingTeam.id : null
    };
    acc.push(mergedEvent);
    return acc;
  }, []);
};

export const mergeChallenges = (
  challenges: Doc<Challenge>[],
  eventChallenges: Doc<EventChallenge>[]
): MergeChallenge[] => {
  return eventChallenges.reduce<MergeChallenge[]>((acc, eventChallenge) => {
    const matchingChallenge = challenges.find((challenge) => challenge.id === eventChallenge.props.challengeId);
    if (matchingChallenge) {
      const mergedChallenge: MergeChallenge = {
        id: matchingChallenge.id,
        name: matchingChallenge.props.name,
        description: matchingChallenge.props.description,
        rules: matchingChallenge.props.rules,
        type: matchingChallenge.props.type,
        points: matchingChallenge.props.points,
        complexity: matchingChallenge.props.complexity,
        eventId: eventChallenge.props.eventId,
        eventStartDate: eventChallenge.props.eventStartDate,
        status: eventChallenge.props.status,
        maxTimes: eventChallenge.props.maxTimes,
        startDate: eventChallenge.props.startDate,
        endDate: eventChallenge.props.endDate
      };
      acc.push(mergedChallenge);
    }
    return acc;
  }, []);
};

export const splitByDate = <T extends Record<string, any>, K extends keyof T>(
  items: Doc<T>[],
  key: K & (T[K] extends Date ? K : never)
) => {
  return items.reduce(
    (acc, cur) => {
      const target = (cur.props[key] as Date).getTime() > new Date().getTime() ? 'future' : 'past';
      acc[target].push(cur);
      return acc;
    },
    { future: [] as Doc<T>[], past: [] as Doc<T>[] }
  );
};
