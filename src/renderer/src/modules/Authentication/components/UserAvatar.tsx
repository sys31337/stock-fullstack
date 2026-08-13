import { assetsBase } from '@web/config';
import { PublicUser } from '../api/useGetAllUsers';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
};

interface UserAvatarProps {
  user: PublicUser;
  size?: AvatarSize;
}

const UserAvatar = ({ user, size = 'lg' }: UserAvatarProps) => {
  const hasImage = user.profilePicture && user.profilePicture !== 'default.png';
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20 ring-4 ring-white/20`}
    >
      {hasImage ? (
        <img
          src={`${assetsBase}assets/${user.profilePicture}`}
          alt={user.fullname || user.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-bold tracking-wide">
          {(user.fullname || user.username || '?')[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
