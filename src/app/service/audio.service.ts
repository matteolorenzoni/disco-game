import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService implements OnDestroy {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  // Percorsi dei suoni
  private sounds = {
    OK: 'audio/ok.mp3', // URL del suono di conferma
    ERROR: 'audio/error.mp3' // URL del suono di errore
  };

  // Variabile per mantenere traccia dello stato del suono attuale
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.initializeAudioContext();
    this.setupVisibilityChangeListener();
  }

  private initializeAudioContext(): void {
    // Crea un AudioContext se supportato
    if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  // Configura l'ascoltatore per visibilitychange
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.stopCurrentAudio(); // Ferma l'audio quando l'app va in background
      }
    });
  }

  // Riproduce un suono in base al tipo
  public playAudio(type: 'OK' | 'ERROR'): void {
    // Se c'è un audio in riproduzione, fermalo
    this.stopCurrentAudio();

    // Crea un nuovo elemento audio
    this.currentAudio = new Audio(this.sounds[type]);
    this.currentAudio.play();

    // Ferma l'audio quando termina
    this.currentAudio.onended = () => {
      this.currentAudio = null; // Rimuovi il riferimento all'audio corrente
    };
  }

  // Ferma l'audio corrente
  private stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0; // Resetta il tempo di riproduzione
      this.currentAudio = null; // Rimuovi il riferimento all'audio
    }
  }

  // Pulisci l'ascoltatore quando il servizio viene distrutto
  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.setupVisibilityChangeListener);
  }
}
