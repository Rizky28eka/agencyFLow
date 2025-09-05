"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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

export function DatePickerWithRange({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: new Date(2025, 0, 20),
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

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
