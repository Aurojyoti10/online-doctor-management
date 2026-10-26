import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Stethoscope, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/Card';
import { specializations } from '@/data/specializations';
import { doctors } from '@/data/doctors';

export function SpecializationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Browse by Specialization</h1>
          <p className="text-navy-500 mt-2">Find the right specialist for your health needs</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specializations.map((spec) => {
            const IconComp = (Icons as unknown as Record<string, React.ElementType>)[spec.icon] || Stethoscope;
            const count = doctors.filter(d => d.specializationId === spec.id).length;
            return (
              <Card key={spec.id} className="card-hover p-5 cursor-pointer" onClick={() => navigate(`/doctors?spec=${spec.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                    <IconComp className="w-6 h-6 text-primary-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-navy-300" />
                </div>
                <h3 className="font-semibold text-navy-900 mt-3">{spec.name}</h3>
                <p className="text-sm text-navy-500 mt-1">{spec.description}</p>
                <p className="text-xs text-primary-600 font-medium mt-3">{count} doctors available</p>
              </Card>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
