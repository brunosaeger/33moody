import { FollowRobot } from '@/lib/scene3d';
import type { LayerProps } from '../types';
import { GenericAmrModel } from './GenericAmrModel';

/** Modelo do robô na pose atual. */
export function RobotLayer({ profile }: LayerProps) {
  return (
    <FollowRobot>
      <GenericAmrModel body={profile.body} />
    </FollowRobot>
  );
}
