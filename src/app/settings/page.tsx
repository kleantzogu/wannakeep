'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/store/settings'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { 
    theme, 
    notesPerProject, 
    noteCharLimit, 
    setTheme, 
    setNotesPerProject, 
    setNoteCharLimit,
    loadUserSettings,
    isLoading: isLoadingSettings,
    userId
  } = useSettings()

  const [exportFormat, setExportFormat] = useState('json')
  const [isSaving, setIsSaving] = useState(false)
  const [localTheme, setLocalTheme] = useState(theme)
  const [localNotesPerProject, setLocalNotesPerProject] = useState(notesPerProject)
  const [localNoteCharLimit, setLocalNoteCharLimit] = useState(noteCharLimit)

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])

  // Update local values when settings are loaded
  useEffect(() => {
    setLocalTheme(theme)
    setLocalNotesPerProject(notesPerProject)
    setLocalNoteCharLimit(noteCharLimit)
  }, [theme, notesPerProject, noteCharLimit])
  
  // Mock function for demonstration
  const handleExportData = () => {
    alert(`Data would be exported in ${exportFormat} format`)
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      await setTheme(localTheme)
      await setNotesPerProject(localNotesPerProject)
      await setNoteCharLimit(localNoteCharLimit)
      
      if (userId) {
        toast.success('Settings saved successfully to your account')
      } else {
        toast.success('Settings saved locally')
        toast.info('Sign in to save settings across devices')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = localTheme !== theme || 
                    localNotesPerProject !== notesPerProject || 
                    localNoteCharLimit !== noteCharLimit
  
  if (isLoadingSettings) {
    return (
      <div className="h-full pl-[240px] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full pl-[240px] bg-background">
      <div className="h-full p-3">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <Button 
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : 'Save Changes'}
          </Button>
        </div>
        
        <div className="space-y-6 max-w-3xl">
          {/* Personalization info */}
          {!userId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-4">
              <p className="text-sm">
                Your settings are currently saved locally. 
                <a href="/login" className="ml-1 underline font-medium">Sign in</a> to save your settings to your account and access them from any device.
              </p>
            </div>
          )}
          
          {/* Appearance Section */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Appearance & Generation</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium mb-1">
                  Theme
                </label>
                <select
                  id="theme"
                  value={localTheme}
                  onChange={(e) => setLocalTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full h-9 px-3 rounded-md border bg-background"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose how Wannakeep appears to you. Select System to match your device settings.
                </p>
              </div>

              <div className="pt-4 border-t">
                <label htmlFor="notes-per-project" className="block text-sm font-medium mb-1">
                  Notes per Project
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="notes-per-project"
                    min="1"
                    max="10"
                    value={localNotesPerProject}
                    onChange={(e) => setLocalNotesPerProject(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium w-8 text-center">{localNotesPerProject}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Set your preferred number of notes to generate per project (1-10). This affects all future note generations.
                </p>
              </div>

              <div className="pt-4 border-t">
                <label htmlFor="note-char-limit" className="block text-sm font-medium mb-1">
                  Note Character Limit
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="note-char-limit"
                    min="120"
                    max="360"
                    step="20"
                    value={localNoteCharLimit}
                    onChange={(e) => setLocalNoteCharLimit(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium w-12 text-center">{localNoteCharLimit}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Set the maximum character limit for generated notes (120-360). Higher values allow for more detailed notes.
                </p>
              </div>
            </div>
          </div>
          
          {/* Data Management Section */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Data Management</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="export-format" className="block text-sm font-medium mb-1">
                  Export Format
                </label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              
              <Button onClick={handleExportData} variant="outline" className="w-full sm:w-auto">
                Export All Notes
              </Button>
              
              <div className="pt-4 border-t mt-4">
                <h3 className="text-base font-medium mb-3">Danger Zone</h3>
                <Button 
                  variant="destructive"
                  onClick={() => confirm('Are you sure? This cannot be undone.') && alert('Data would be deleted')}
                  className="w-full sm:w-auto"
                >
                  Delete All Notes
                </Button>
              </div>
            </div>
          </div>
          
          {/* About Section */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">About Wannakeep</h2>
            
            <div className="space-y-3">
              <p className="text-sm">
                Version: 0.1.0 (Beta)
              </p>
              <p className="text-sm text-muted-foreground">
                Wannakeep is a note-keeping and organization app designed to save users countless hours 
                by efficiently capturing, organizing, and managing notes from various sources, 
                including meetings, PDFs, text files, and ebooks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 