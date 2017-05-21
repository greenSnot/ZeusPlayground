import {
  voxels_to_geo_attributes,
} from '../voxel';

const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  const voxels = event.data;
  ctx.postMessage(voxels_to_geo_attributes(voxels));
});