import { useSetAtom, WritableAtom } from 'jotai';
import { ClientEvent, MatrixClient, Room, RoomEvent } from 'matrix-js-sdk';
import { useEffect } from 'react';
import { Membership } from '../../../types/matrix/room';

export type RoomsAction =
  | {
      type: 'INITIALIZE';
      rooms: string[];
    }
  | {
      type: 'PUT' | 'DELETE';
      roomId: string;
    };

export const useBindRoomsWithMembershipsAtom = (
  mx: MatrixClient,
  roomsAtom: WritableAtom<string[], [RoomsAction], undefined>,
  memberships: Membership[]
) => {
  const setRoomsAtom = useSetAtom(roomsAtom);

  useEffect(() => {
    // Pułapka na pokoje powitalne Matrix.org
    const isWelcomeRoom = (room: Room) =>
      room.name === 'Matrix HQ' || 
      room.name === 'Matrix' || 
      room.name === 'Matrix.org' || 
      room.getCanonicalAlias() === '#matrix:matrix.org';

    const satisfyMembership = (room: Room): boolean =>
      !!memberships.find((membership) => membership === room.getMyMembership());
      
    setRoomsAtom({
      type: 'INITIALIZE',
      rooms: mx
        .getRooms()
        .filter((room) => {
          if (isWelcomeRoom(room)) {
            mx.leave(room.roomId).catch(() => {}); // Ciche wyjście
            return false; // Ukrycie na starcie
          }
          return satisfyMembership(room);
        })
        .map((room) => room.roomId),
    });

    const handleAddRoom = (room: Room) => {
      if (isWelcomeRoom(room)) {
        mx.leave(room.roomId).catch(() => {});
        return;
      }
      if (satisfyMembership(room)) {
        setRoomsAtom({ type: 'PUT', roomId: room.roomId });
      }
    };

    const handleMembershipChange = (room: Room) => {
      if (isWelcomeRoom(room)) {
        mx.leave(room.roomId).catch(() => {});
        return;
      }
      if (satisfyMembership(room)) {
        setRoomsAtom({ type: 'PUT', roomId: room.roomId });
      } else {
        setRoomsAtom({ type: 'DELETE', roomId: room.roomId });
      }
    };

    const handleDeleteRoom = (roomId: string) => {
      setRoomsAtom({ type: 'DELETE', roomId });
    };

    mx.on(ClientEvent.Room, handleAddRoom);
    mx.on(RoomEvent.MyMembership, handleMembershipChange);
    mx.on(ClientEvent.DeleteRoom, handleDeleteRoom);
    return () => {
      mx.removeListener(ClientEvent.Room, handleAddRoom);
      mx.removeListener(RoomEvent.MyMembership, handleMembershipChange);
      mx.removeListener(ClientEvent.DeleteRoom, handleDeleteRoom);
    };
  }, [mx, memberships, setRoomsAtom]);
};

export const compareRoomsEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((roomId, roomIdIndex) => roomId === b[roomIdIndex]);
};
