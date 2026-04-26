import React from 'react';
import { Trophy, Star, Award, TrendingUp, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface LeaderboardUser {
  id: string;
  fullName: string;
  avatar: string;
  points: number;
  badges: string[];
  reputation: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.gamification.getLeaderboard();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Đang tải bảng xếp hạng...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Trophy size={24} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bảng Xếp Hạng</h2>
              <p className="text-blue-100 text-xs">Những người dùng tích cực nhất AmazeBid</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20">
            Cập nhật trực tiếp
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-4 mt-8 mb-2">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-2">
                <img 
                  src={leaderboard[1].avatar} 
                  alt={leaderboard[1].fullName} 
                  className="w-16 h-16 rounded-full border-4 border-gray-300 shadow-lg group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-2 -right-2 bg-gray-300 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                  2
                </div>
              </div>
              <p className="text-xs font-bold truncate w-20 text-center">{leaderboard[1].fullName}</p>
              <p className="text-[10px] text-blue-200">{(leaderboard[1].points || 0).toLocaleString()} pts</p>
            </div>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center group -translate-y-4">
              <div className="relative mb-2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-300 animate-bounce">
                  <Trophy size={28} />
                </div>
                <img 
                  src={leaderboard[0].avatar} 
                  alt={leaderboard[0].fullName} 
                  className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-xl group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white">
                  1
                </div>
              </div>
              <p className="text-sm font-black truncate w-24 text-center">{leaderboard[0].fullName}</p>
              <p className="text-xs text-yellow-200 font-bold">{(leaderboard[0].points || 0).toLocaleString()} pts</p>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center group">
              <div className="relative mb-2">
                <img 
                  src={leaderboard[2].avatar} 
                  alt={leaderboard[2].fullName} 
                  className="w-16 h-16 rounded-full border-4 border-amber-600 shadow-lg group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-2 -right-2 bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                  3
                </div>
              </div>
              <p className="text-xs font-bold truncate w-20 text-center">{leaderboard[2].fullName}</p>
              <p className="text-[10px] text-blue-200">{(leaderboard[2].points || 0).toLocaleString()} pts</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-2">
        <div className="space-y-1">
          {leaderboard.slice(3).map((user, index) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                  {index + 4}
                </span>
                <div className="relative">
                  <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full border border-gray-100" />
                  {user.reputation > 90 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white">
                      <ShieldCheck size={10} />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{user.fullName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star size={8} className="text-yellow-500 fill-yellow-500" />
                      {user.reputation}% Uy tín
                    </span>
                    {user.badges.slice(0, 1).map(badge => (
                      <span key={badge} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">{(user.points || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Điểm tích lũy</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Award size={14} className="text-blue-500" />
            <span>Cách nhận điểm:</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><TrendingUp size={12} /> Đấu giá: +10</span>
            <span className="flex items-center gap-1"><TrendingUp size={12} /> Mua hàng: +1/$10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
