# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2020-12-17

### Added

- Highlight State for Furniture

### Changed

- **BREAKING:** Tile Map Parsing behavior

  Tile map parsing is now equal to how the original tilemaps work. That means each row and column should be padded with an empty (`x`) tile. So for example:

  ```
  00
  00
  ```

  becomes

  ```
  xxx
  x00
  x00
  ```

### Fixed

- Regression where landscapes for some walls don't work

## [0.1.3] - 2020-12-15

### Added

- `Room` improvements
  - `removeRoomObject` method to remove an object from a room
  - `roomObjects` to access all present room objects
- Ability to dump and use furniture when revision is not set
- Add `move` method for moving `FloorFurniture` and `Avatar` objects
- Add `RoomCamera` class for handling drag, drop & snapback for a `Room` (thanks @mtwzim)

### Changed

- `roomHeight` & `roomWidth` now return the actual height and width of the room

### Fixed

- Cross Origin issue with `HitTexture`

## [0.1.2] - 2020-12-13

### Added

- Ability to set landscapes, which are seen through windows

### Fixed

- Click handling on furniture when a sprite is mirrored
- Furniture loading of colored items (i.e. `rare_dragonlamp*4`)

## [0.1.0-alpha.14] - 2020-12-09

### Added

- Door visualization for room

### Changed

- **BREAKING**: Figure assets dumping behavior.
  Figure images now get dumped into a separate subdirectory corresponding to the library name. You will need to delete your old `figure` folder and rerun the `shroom dump` command to regenerate those resources.

### Fixed

- Furniture & Avatar textures when display is scaled