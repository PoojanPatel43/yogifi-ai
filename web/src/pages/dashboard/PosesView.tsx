import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Pose {
  id: string;
  name: string;
  sanskritName: string;
  difficulty: string;
  description: string;
  imageUrl?: string;
  targetDurationSeconds: number;
}

const PosesView: React.FC = () => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoses = async () => {
      try {
        const response = await api.get('/poses/list');
        if (response.data && response.data.data) {
          setPoses(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch poses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="font-mono text-clay tracking-widest animate-pulse">LOADING POSES...</div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h2 className="font-serif italic text-3xl text-cream mb-2">Yoga Postures</h2>
        <p className="font-outfit text-cream/50">Select a dynamic pose to begin AI tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {poses.map((pose) => (
          <div key={pose.id} className="bg-charcoal/40 border border-cream/5 rounded-[2rem] p-6 hover:border-clay/30 transition-colors flex flex-col group">
            
            <div className="w-full h-48 bg-[#111] rounded-xl mb-6 overflow-hidden relative">
              {pose.imageUrl ? (
                <img src={pose.imageUrl} alt={pose.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cream/10 font-serif italic text-2xl">
                  {pose.sanskritName}
                </div>
              )}
              <div className="absolute top-3 right-3 bg-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full border border-cream/10 font-mono text-[10px] uppercase text-cream/70 tracking-widest">
                {pose.difficulty}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-sans font-bold text-xl text-cream mb-1">{pose.name}</h3>
              <p className="font-serif italic text-clay/80 mb-4">{pose.sanskritName}</p>
              <p className="font-outfit text-sm text-cream/60 line-clamp-3 mb-6">
                {pose.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto border-t border-cream/5 pt-4">
              <div className="font-mono text-xs text-cream/40">
                {pose.targetDurationSeconds} SEC
              </div>
              <Link to={`/session?poseId=${pose.id}`} className="flex items-center gap-2 text-clay hover:text-cream transition-colors text-sm font-bold uppercase tracking-wider">
                <Play size={16} className="fill-current" />
                Start
              </Link>
            </div>

          </div>
        ))}
        {poses.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-cream/10 rounded-2xl text-cream/40 font-outfit">
            No poses available from server.
          </div>
        )}
      </div>
    </div>
  );
};

export default PosesView;
