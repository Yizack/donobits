# donobits

Twitch extension that allows your community to redeem recorded sounds with Bits and have it played live on stream.

## Features

- Browse and search the clip library
- Preview clips and adjust volume
- Redeem clips with Bits while live
- Import content from supported providers
- Queue audio in real time
- Bits transactions

## Supported providers

- [donoclip.com](https://www.donoclip.com/)

## How it works

1. The broadcaster imports their content from the Extension config view.
2. donobits provides a channel-specific URL to add as a Browser Source.
3. Viewers browse the imported clips in the Extension panel and redeem one with Bits from the Extension panel.
4. The server validates the transaction and sends the clip to the broadcaster's connected source.
5. The broadcaster's connected source plays the queued clips in order and advances when each clip ends.

## Screenshots

### Twitch Extension panel

![Twitch Extension panel showing available clips](https://github.com/user-attachments/assets/f5ff4fb3-c433-4977-a45c-2ad76bd8bad8)

### Stream Browser Source

![Browser Source playing a redeemed clip](https://github.com/user-attachments/assets/54e8c611-05dd-4e62-93f8-a5acb5b9645d)

### Twitch Extension config

![Twitch Extension config view](https://github.com/user-attachments/assets/1d465fbf-af5b-490e-bbb7-7d08b630db2a)

### Imported donoclip content

![Twitch Extension showing imported donoclip content](https://github.com/user-attachments/assets/20d8668d-8a56-4266-bb59-4f1701c733f0)
