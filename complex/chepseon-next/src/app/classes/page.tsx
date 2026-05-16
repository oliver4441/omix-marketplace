'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface ClassType {
  id: number
  name: string
}

interface Section {
  id: number
  name: string
}

interface MyClass {
  id: number
  name: string
  classType: ClassType
  section: Section | null
}

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<MyClass[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'classes' | 'add'>('classes')
  const [newClass, setNewClass] = useState({
    name: '',
    classTypeId: '',
    sectionId: ''
  })
  const [editingClassId, setEditingClassId] = useState<number | null>(null)
  const [editClassData, setEditClassData] = useState({
    name: '',
    classTypeId: '',
    sectionId: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData(token)
  }, [])

  const fetchData = async (token: string) => {
    try {
      // Fetch classes
      const classesRes = await fetch(`/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes)
      }

      // Fetch class types (using subjects endpoint as class types)
      const classTypesRes = await fetch(`/api/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (classTypesRes.ok) {
        const classTypesData = await classTypesRes.json()
        setClassTypes(classTypesData.subjects || [])
      }

      // Fetch sections
      const sectionsRes = await fetch(`/api/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json()
        setSections(sectionsData.sections || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClass.name,
          classTypeId: parseInt(newClass.classTypeId),
          sectionId: parseInt(newClass.sectionId),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setClasses([...classes, data.class])
        setNewClass({ name: '', classTypeId: '', sectionId: '' })
        setActiveTab('classes')
      } else {
        const errorData = await res.json()
        alert(`Failed to add class: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error adding class:', error)
      alert('Failed to add class')
    }
  }

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClassId) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/classes/${editingClassId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editClassData.name,
          classTypeId: parseInt(editClassData.classTypeId),
          sectionId: parseInt(editClassData.sectionId),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const updatedClasses = classes.map(cls =>
          cls.id === editingClassId ? data.class : cls
        )
        setClasses(updatedClasses)
        setEditingClassId(null)
        setActiveTab('classes')
      } else {
        const errorData = await res.json()
        alert(`Failed to update class: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating class:', error)
      alert('Failed to update class')
    }
  }

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setClasses(classes.filter(cls => cls.id !== id))
      } else {
        const errorData = await res.json()
        alert(`Failed to delete class: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Failed to delete class')
    }
  }

  const handleEditClick = (cls: MyClass) => {
    setEditingClassId(cls.id)
    setEditClassData({
      name: cls.name,
      classTypeId: cls.classType.id.toString(),
      sectionId: cls.section?.id?.toString() || '',
    })
    setActiveTab('add')
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Loading Classes...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Classes Management</h1>
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('add')}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              Add New Class
            </Button>
          </div>

          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="classes">Classes List</TabsTrigger>
              <TabsTrigger value="add">Add New Class</TabsTrigger>
            </TabsList>

            <TabsContent value="classes">
              {!classes.length ? (
                <p className="text-center py-8 text-gray-500">No classes found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left w-20">ID</TableHead>
                      <TableHead className="text-left">Name</TableHead>
                      <TableHead className="text-left">Class Type</TableHead>
                      <TableHead className="text-left">Section</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map(cls => (
                      <TableRow key={cls.id} className="hover:bg-gray-50">
                        <TableCell>{cls.id}</TableCell>
                        <TableCell>{cls.name}</TableCell>
                        <TableCell>{cls.classType.name}</TableCell>
                        <TableCell>{cls.section?.name || 'No Section'}</TableCell>
                        <TableCell className="flex justify-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClick(cls)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => handleDeleteClass(cls.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="add">
              <form onSubmit={editingClassId ? handleUpdateClass : handleAddClass} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Class Name</label>
                  <Input
                    value={editingClassId ? editClassData.name : newClass.name}
                    onChange={(e) => {
                      if (editingClassId) {
                        setEditClassData(prev => ({ ...prev, name: e.target.value }))
                      } else {
                        setNewClass(prev => ({ ...prev, name: e.target.value }))
                      }
                    }}
                    placeholder="Enter class name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Class Type</label>
                  <Input
                    value={editingClassId ? editClassData.classTypeId : newClass.classTypeId}
                    onChange={(e) => {
                      if (editingClassId) {
                        setEditClassData(prev => ({ ...prev, classTypeId: e.target.value }))
                      } else {
                        setNewClass(prev => ({ ...prev, classTypeId: e.target.value }))
                      }
                    }}
                    placeholder="Select class type"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Section</label>
                  <Input
                    value={editingClassId ? editClassData.sectionId : newClass.sectionId}
                    onChange={(e) => {
                      if (editingClassId) {
                        setEditClassData(prev => ({ ...prev, sectionId: e.target.value }))
                      } else {
                        setNewClass(prev => ({ ...prev, sectionId: e.target.value }))
                      }
                    }}
                    placeholder="Select section"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setEditingClassId(null)
                      setEditClassData({ name: '', classTypeId: '', sectionId: '' })
                      setNewClass({ name: '', classTypeId: '', sectionId: '' })
                      setActiveTab('classes')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="primary"
                  >
                    {editingClassId ? 'Update Class' : 'Add Class'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
