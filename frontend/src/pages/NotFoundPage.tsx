import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-primary-200">404</p>
        <h1 className="text-2xl font-bold text-navy-900 mt-2">Page Not Found</h1>
        <p className="text-navy-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link to="/"><Button className="w-full sm:w-auto"><Home className="w-4 h-4" /> Go Home</Button></Link>
          <Link to="/doctors"><Button variant="outline" className="w-full sm:w-auto"><Search className="w-4 h-4" /> Find Doctors</Button></Link>
        </div>
      </div>
    </div>
  );
}
