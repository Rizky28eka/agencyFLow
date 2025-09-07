"use client"

import * as React from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Button } from "@/components/ui/button";

const generatedReports = [
    {
        id: "rep-1",
        name: "Q3 Financial Summary",
        type: "Financial",
        dateGenerated: "2025-07-15",
        status: "Completed",
    },
    {
        id: "rep-2",
        name: "Client Activity Report",
        type: "Activity",
        dateGenerated: "2025-07-12",
        status: "Completed",
    },
    {
        id: "rep-3",
        name: "Project ROI Analysis",
        type: "Financial",
        dateGenerated: "2025-07-10",
        status: "Completed",
    },
]



export default function ReportsPage() {
  return (
    <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Card>
            <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
                <div className="flex flex-col space-y-1.5">
                    <label htmlFor="report-type">Report Type</label>
                    <Select>
                        <SelectTrigger id="report-type" className="w-[200px]">
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="financial">Financial Report</SelectItem>
                            <SelectItem value="activity">Client Activity</SelectItem>
                            <SelectItem value="project">Project Summary</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                    <label>Date Range</label>
                    <DatePickerWithRange />
                </div>
                <Button className="self-end">Generate Report</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date Generated</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {generatedReports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell>{report.name}</TableCell>
                                <TableCell>{report.type}</TableCell>
                                <TableCell>{report.dateGenerated}</TableCell>
                                <TableCell><Badge>{report.status}</Badge></TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm">Download</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
