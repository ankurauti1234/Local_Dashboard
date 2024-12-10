"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Waves,
  ShieldCheck,
  Users,
  RefreshCw,
  CalendarRange,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TYPES = [
  { id: 30, name: "Audio", icon: Waves },
  { id: 29, name: "Logo", icon: ShieldCheck },
  { id: 3, name: "Members", icon: Users },
];

const REFRESH_RATES = [
  { value: 10, label: "10 sec" },
  { value: 30, label: "30 sec" },
  { value: 60, label: "1 min" },
];

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDarkMode));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="bg-background hover:bg-accent rounded-lg"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
    </Button>
  );
};

const FilterBar = ({
  filters,
  onFilterChange,
  isVisible,
  onToggleVisibility,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateRange, setDateRange] = useState({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  const updateFilters = (newFilters) => {
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeSelect = (range) => {
    const newFilters = {
      ...localFilters,
      startDate: range.from ? range.from.toISOString().split("T")[0] : "",
      endDate: range.to ? range.to.toISOString().split("T")[0] : "",
    };
    setDateRange(range);
    updateFilters(newFilters);
  };

  const clearDateRange = () => {
    const newFilters = { ...localFilters, startDate: "", endDate: "" };
    setDateRange({});
    updateFilters(newFilters);
  };

  return (
    <div className="w-full">
      {isVisible && (
        <Card className="mb-4 flex gap-4 p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Device ID</label>
            <Input
              placeholder="Enter Device ID (eg:200006)"
              value={localFilters.deviceId || ""}
              onChange={(e) =>
                updateFilters({ ...localFilters, deviceId: e.target.value })
              }
              className="w-full p-2 border bg-background rounded-md focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal p-2",
                      !dateRange.from &&
                        !dateRange.to &&
                        "text-muted-foreground"
                    )}
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "PPP")} - ${format(
                          dateRange.to,
                          "PPP"
                        )}`
                      ) : (
                        format(dateRange.from, "PPP")
                      )
                    ) : (
                      <span>Select Date Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearDateRange}
                  className="hover:bg-destructive/10"
                >
                  <X className="h-5 w-5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default function IoTDashboard() {
  const [refreshRate, setRefreshRate] = useState(30);
  const [filters, setFilters] = useState({
    deviceId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [data, setData] = useState({});
  const [activeType, setActiveType] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/data`, {
        params: { type: activeType, ...filters },
      });
      setData((prev) => ({ ...prev, [activeType]: response.data.data }));
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [activeType, filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshRate * 1000);
    return () => clearInterval(interval);
  }, [fetchData, refreshRate]);

  const currentData = data[activeType] || [];
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  const formatCellValue = (row, key) => {
    if (key === "ts") {
      return new Date(new Date(row[key]).getTime() + 5.5 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .split(".")[0];
    }
    return Array.isArray(row[key]) ? row[key].join(", ") : row[key];
  };

  return (
    <div className="container mx-auto px-4 py-4 h-screen flex flex-col max-w-7xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="bg-background hover:bg-accent rounded-lg mr-2"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        isVisible={isFilterVisible}
        onToggleVisibility={() => setIsFilterVisible(!isFilterVisible)}
      />

      <Card className="border rounded-lg overflow-hidden flex flex-col flex-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 bg-background p-1 rounded-lg">
              {TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={activeType === type.id ? "default" : "ghost"}
                  onClick={() => setActiveType(type.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-xs md:text-sm",
                    activeType === type.id
                      ? "text-black hover:opacity-90"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  <type.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{type.name}</span>
                </Button>
              ))}
            </div>
            <Select
              value={refreshRate.toString()}
              onValueChange={(value) => setRefreshRate(Number(value))}
            >
              <SelectTrigger className="w-fit bg-muted rounded-lg border-none text-xs md:text-sm">
                <SelectValue>
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {
                        REFRESH_RATES.find((r) => r.value === refreshRate)
                          ?.label
                      }
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REFRESH_RATES.map((rate) => (
                  <SelectItem key={rate.value} value={rate.value.toString()}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 overflow-auto">
          {currentData.length ? (
            <>
              <Table className="flex-1">
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    {columns.map((key) => (
                      <TableHead
                        key={key}
                        className="text-md text-foreground font-bold uppercase tracking-wider whitespace-nowrap"
                      >
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.slice(0, 10).map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      {columns.map((key) => (
                        <TableCell
                          key={key}
                          className="text-xs sm:text-base whitespace-nowrap"
                        >
                          {formatCellValue(row, key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-4 bg-muted/50 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Prev
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {filters.page} of {Math.ceil(totalItems / filters.limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={
                    filters.page >= Math.ceil(totalItems / filters.limit)
                  }
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <p className="text-lg font-semibold text-muted-foreground">
                No Data Available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
