import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Download, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { exportToFile, importFromFile, saveSyncData, loadSyncData, getSyncStatus } from '@/lib/sync';
import { toast } from 'sonner';

const Settings = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le statut de synchronisation au démarrage
  useEffect(() => {
    const status = getSyncStatus();
    setLastSyncTime(status.lastSync);
  }, []);

  const handleExport = async () => {
    const success = await exportToFile();
    if (success) {
      toast.success('Données exportées avec succès');
    } else {
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importFromFile(file);
      if (result.success) {
        toast.success(result.message);
        // Rafraîchir la page pour afficher les nouvelles données
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'importation');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Sauvegarder d'abord
      await saveSyncData();
      // Puis charger pour s'assurer que tout est à jour
      const result = await loadSyncData();
      if (result.success) {
        toast.success('Synchronisation réussie');
        setLastSyncTime(new Date());
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Jamais';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;

    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header global */}
      <Header />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl space-y-6">
        {/* Synchronisation */}
        <Card className="border border-border shadow-none">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-6">Synchronisation</h2>

            <div className="space-y-6">
              {/* Statut */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Synchronisation automatique active
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dernière sync: {formatLastSync(lastSyncTime)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sync...' : 'Synchroniser'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Import / Export */}
        <Card className="border border-border shadow-none">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-6">Import / Export</h2>

            <div className="space-y-6">
              {/* Export */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Exporter les données
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Téléchargez toutes vos données (projets et entrées de temps) au format JSON.
                  Ce fichier peut être utilisé pour synchroniser vos données entre différents navigateurs ou appareils.
                </p>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary/5"
                >
                  <Download className="h-4 w-4" />
                  Exporter en JSON
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                {/* Import */}
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Importer les données
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Importez des données depuis un fichier JSON exporté. Les données seront fusionnées intelligemment
                  avec vos données existantes (les entrées les plus récentes sont conservées).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary/5"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? 'Importation...' : 'Importer depuis JSON'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
