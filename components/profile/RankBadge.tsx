'use client';

import { Shield, Crown, Award, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type RankType = 'Initiate' | 'Page' | 'Squire' | 'Knight' | 'King';

interface RankBadgeProps {
  rank: RankType;
  showIconOnly?: boolean;
}

const rankConfig = {
  Initiate: {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: User,
    label: 'Initiate'
  },
  Page: {
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: Award,
    label: 'Page'
  },
  Squire: {
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    icon: Star,
    label: 'Squire'
  },
  Knight: {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: Shield,
    label: 'Knight',
    specialIcon: '⚔️'
  },
  King: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Crown,
    label: 'King',
    specialIcon: '👑'
  }
};

export default function RankBadge({ rank, showIconOnly = false }: RankBadgeProps) {
  const config = rankConfig[rank] || rankConfig.Initiate;
  const Icon = config.icon;

  if (showIconOnly) {
    return (
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`p-1.5 rounded-full ${config.color} border shadow-sm`}
        title={config.label}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {rank === 'Knight' || rank === 'King' ? (
         <span className="ml-1 text-sm leading-none">
           {rank === 'Knight' ? '🛡️' : '👑'}
         </span>
      ) : null}
    </div>
  );
}
