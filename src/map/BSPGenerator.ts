import Phaser from "phaser"
import {
  TileType, RoomType, Room, BSPNode, DungeonData,
  MAP_WIDTH, MAP_HEIGHT, BSP_MAX_DEPTH, MIN_LEAF_SIZE, MIN_ROOM_SIZE,
} from "./types"

export function generateDungeon(seed?: number): DungeonData {
  if (seed !== undefined) {
    Phaser.Math.RND.sow([String(seed)])
  }

  const grid: TileType[][] = Array.from(
    { length: MAP_HEIGHT },
    () => Array(MAP_WIDTH).fill(TileType.WALL),
  )

  const root: BSPNode = {
    x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT,
    left: null, right: null, room: null,
  }

  splitNode(root, 0)
  createRooms(grid, root)
  const rooms: Room[] = []
  collectRooms(root, rooms)

  const startRoom = rooms[0]
  startRoom.type = RoomType.START

  if (rooms.length > 1) rooms[1].type = RoomType.TREASURE
  for (let i = 2; i < rooms.length; i++) {
    rooms[i].type = RoomType.COMBAT
  }

  connectRooms(grid, root)

  for (const room of rooms) {
    carveRoom(grid, room)
  }

  return { grid, rooms, startRoom }
}

function splitNode(node: BSPNode, depth: number): void {
  if (depth >= BSP_MAX_DEPTH) return

  const minSize = MIN_LEAF_SIZE * 2
  if (node.width < minSize || node.height < minSize) return

  let horizontal: boolean
  if (node.width > node.height * 1.25) {
    horizontal = false
  } else if (node.height > node.width * 1.25) {
    horizontal = true
  } else {
    horizontal = Math.random() < 0.5
  }

  const max = horizontal ? node.height : node.width
  if (max < minSize) return

  const splitPos = Phaser.Math.Between(MIN_LEAF_SIZE, max - MIN_LEAF_SIZE)

  if (horizontal) {
    node.left = {
      x: node.x, y: node.y, width: node.width, height: splitPos,
      left: null, right: null, room: null,
    }
    node.right = {
      x: node.x, y: node.y + splitPos, width: node.width, height: node.height - splitPos,
      left: null, right: null, room: null,
    }
  } else {
    node.left = {
      x: node.x, y: node.y, width: splitPos, height: node.height,
      left: null, right: null, room: null,
    }
    node.right = {
      x: node.x + splitPos, y: node.y, width: node.width - splitPos, height: node.height,
      left: null, right: null, room: null,
    }
  }

  splitNode(node.left, depth + 1)
  splitNode(node.right, depth + 1)
}

function createRooms(grid: TileType[][], node: BSPNode): void {
  if (node.left || node.right) {
    if (node.left) createRooms(grid, node.left)
    if (node.right) createRooms(grid, node.right)
    return
  }

  const padding = Phaser.Math.Between(1, 2)
  const roomW = Math.max(MIN_ROOM_SIZE, node.width - padding * 2)
  const roomH = Math.max(MIN_ROOM_SIZE, node.height - padding * 2)
  const roomX = node.x + Phaser.Math.Between(1, node.width - roomW - 1)
  const roomY = node.y + Phaser.Math.Between(1, node.height - roomH - 1)

  node.room = {
    x: roomX,
    y: roomY,
    width: roomW,
    height: roomH,
    cx: Math.floor(roomX + roomW / 2),
    cy: Math.floor(roomY + roomH / 2),
    type: RoomType.COMBAT,
  }
}

function collectRooms(node: BSPNode, rooms: Room[]): void {
  if (node.room) {
    rooms.push(node.room)
  }
  if (node.left) collectRooms(node.left, rooms)
  if (node.right) collectRooms(node.right, rooms)
}

function carveRoom(grid: TileType[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        grid[y][x] = TileType.FLOOR
      }
    }
  }
}

function connectRooms(grid: TileType[][], node: BSPNode): void {
  if (!node.left || !node.right) return

  connectRooms(grid, node.left)
  connectRooms(grid, node.right)

  const room1 = findRoom(node.left)
  const room2 = findRoom(node.right)
  if (!room1 || !room2) return

  const x1 = room1.cx
  const y1 = room1.cy
  const x2 = room2.cx
  const y2 = room2.cy

  if (Math.random() < 0.5) {
    carveHCorridor(grid, Math.min(x1, x2), Math.max(x1, x2), y1)
    carveVCorridor(grid, Math.min(y1, y2), Math.max(y1, y2), x2)
  } else {
    carveVCorridor(grid, Math.min(y1, y2), Math.max(y1, y2), x1)
    carveHCorridor(grid, Math.min(x1, x2), Math.max(x1, x2), y2)
  }
}

function findRoom(node: BSPNode): Room | null {
  if (node.room) return node.room
  const left = node.left ? findRoom(node.left) : null
  if (left) return left
  return node.right ? findRoom(node.right) : null
}

function carveHCorridor(grid: TileType[][], x1: number, x2: number, y: number): void {
  for (let x = x1; x <= x2; x++) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH && grid[y][x] === TileType.WALL) {
      grid[y][x] = TileType.CORRIDOR
    }
  }
}

function carveVCorridor(grid: TileType[][], y1: number, y2: number, x: number): void {
  for (let y = y1; y <= y2; y++) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH && grid[y][x] === TileType.WALL) {
      grid[y][x] = TileType.CORRIDOR
    }
  }
}
