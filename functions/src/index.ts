/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
import { ListUsersResult } from 'firebase-admin/auth';
import { onRequest } from 'firebase-functions/v2/https';

// export const helloWorld = onRequest((request, response) => {
//   logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });

admin.initializeApp();

export const getUsers = onRequest(async (_, res) => {
  try {
    // Array per raccogliere gli utenti con la loro data di creazione
    const authUsers: { uid: string; creationTime: Date | null }[] = [];
    let nextPageToken: string | undefined = undefined;

    // Recupera gli utenti da Firebase Authentication
    do {
      const listUsersResult: ListUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      authUsers.push(
        ...listUsersResult.users
          // .filter((x) => x.email?.includes('test.com')) //! ATTENZIONE: prima questo test
          .map((user) => ({
            uid: user.uid,
            creationTime: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null // Data di creazione
          }))
      );
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // Ottieni la collezione degli utenti da Firestore
    const db = admin.firestore();
    const usersRef = db.collection('DEV_users'); //! ATTENZIONE: prima 'DEV_users'
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      res.status(200).send('No users found.');
      return;
    }

    // Inizializza un batch per aggiornare gli utenti in Firestore
    const batch = db.batch();

    // Per ciascun elemento va a cercare il corrispondente e si aggiorna in base all'info di quest'ultimo
    snapshot.forEach((doc) => {
      const authUser = authUsers.find((x) => x.uid === doc.id);
      if (!authUser) return; // Se non trovi l'utente, salta

      const userRef = usersRef.doc(doc.id);
      batch.update(userRef, {
        registeredAt: authUser.creationTime
      });
    });

    // Esegui il batch di aggiornamenti
    await batch.commit();

    // Rispondi con successo
    res.status(200).json({ message: 'Users updated with registeredAt', data: authUsers });
  } catch (error) {
    // Gestisci l'errore
    console.error('Error fetching or updating users:', error);
    res.status(500).send('Error fetching or updating users: ' + error);
  }
});
