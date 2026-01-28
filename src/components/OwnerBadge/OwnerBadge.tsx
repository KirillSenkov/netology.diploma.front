import './OwnerBadge.css';

type OwnerInfo = {
  id: number;
  username: string;
  full_name: string;
  email: string;
};

type OwnerBadgeProps = {
  owner: OwnerInfo | null;
  userId: number | null;
};

export default function OwnerBadge({ owner, userId }: OwnerBadgeProps) {
  const username = owner?.username ?? (userId !== null ? `id: ${userId}` : '—');
  const fullName = owner?.full_name ?? '—';
  const email = owner?.email ?? null;

  return (
    <div className='ownerBadge'>
      <div className='ownerBadge__username'>{username}</div>

      <div className='ownerBadge__details'>
        <span className='ownerBadge__paren'>(</span>

        <div className='ownerBadge__lines'>
          <div className='ownerBadge__fullName'>{fullName}</div>

          <div className='ownerBadge__emailRow'>
            {email ? (
              <a className='ownerBadge__email' href={`mailto:${email}`}>
                {email}
              </a>
            ) : (
              <span className='ownerBadge__email ownerBadge__email--empty'>—</span>
            )}

            <span className='ownerBadge__mailIcon' aria-hidden='true'>
              ✉
            </span>
          </div>
        </div>

        <span className='ownerBadge__paren'>)</span>
      </div>
    </div>
  );
}
