import { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings, 
  History,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockSchemes } from "@/data/mockSchemes";

const auditLogs = [
  { id: 1, action: "Scheme Updated", user: "admin@gov.in", target: "PM-KISAN", timestamp: "2024-01-15 14:30" },
  { id: 2, action: "Eligibility Rule Added", user: "admin@gov.in", target: "PMAY-Urban", timestamp: "2024-01-15 12:15" },
  { id: 3, action: "New Scheme Created", user: "editor@gov.in", target: "Skill India", timestamp: "2024-01-14 16:45" },
  { id: 4, action: "Scheme Deactivated", user: "admin@gov.in", target: "Old Pension", timestamp: "2024-01-14 10:00" }
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchemes = mockSchemes.filter(scheme => 
    scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scheme.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Panel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Scheme Management
            </h1>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Scheme
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Schemes</p>
              <p className="text-2xl font-bold text-foreground">{mockSchemes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Central Schemes</p>
              <p className="text-2xl font-bold text-primary">{mockSchemes.filter(s => s.level === "Central").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">State Schemes</p>
              <p className="text-2xl font-bold text-accent">{mockSchemes.filter(s => s.level === "State").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold text-success">10</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schemes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schemes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Scheme List
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Eligibility Rules
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Scheme List Tab */}
          <TabsContent value="schemes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Schemes</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schemes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scheme Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchemes.map((scheme) => (
                      <TableRow key={scheme.id}>
                        <TableCell className="font-medium">{scheme.name}</TableCell>
                        <TableCell>{scheme.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{scheme.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{scheme.benefitType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Edit Rules
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eligibility Rules Tab */}
          <TabsContent value="eligibility">
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Rule Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium text-foreground mb-2">Rule Editor Placeholder</h3>
                  <p className="max-w-md mx-auto text-sm">
                    This is where administrators can define eligibility rules using a form-based interface. 
                    Rules include age ranges, income limits, location requirements, etc.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Configure Rules
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
