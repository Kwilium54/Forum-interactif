import type { Peer } from 'crossws'

const peers = new Set<Peer>()

export const addPeer = (peer: Peer) => peers.add(peer)
export const removePeer = (peer: Peer) => peers.delete(peer)

export const broadcastWs = (data: object) => {
  const msg = JSON.stringify(data)
  for (const peer of peers) {
    peer.send(msg)
  }
}
