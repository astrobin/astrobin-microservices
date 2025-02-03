import { DatePipe } from "@angular/common";
import { Injectable } from "@angular/core";
import { BaseService } from "@core/services/base.service";
import { LoadingService } from "@core/services/loading.service";
import { TranslateService } from "@ngx-translate/core";
import { Month } from "@core/enums/month.enum";
import * as Sentry from "@sentry/browser";

@Injectable({
  providedIn: "root"
})
export class DateService extends BaseService {
  constructor(
    public readonly loadingService: LoadingService,
    public readonly translateService: TranslateService,
    public readonly datePipe: DatePipe
  ) {
    super(loadingService);
  }

  datePipeTransform(dateObj: Date, format: string, timezone?: string, locale?: string): string {
    try {
      // Add validation check
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid Date object created");
      }

      const result: string | null = this.datePipe.transform(dateObj, format, timezone, locale);

      if (result === null) {
        throw new Error("DatePipe returned null");
      }

      return result;
    }
  catch (e) {
      const logData = {
        error: e,
        dateObj: dateObj,
        format: format,
        dateToString: dateObj.toString(),
        dateToISO: dateObj.toISOString(),
        dateGetTime: dateObj.getTime()
      };

      if (typeof Sentry !== "undefined") {
        Sentry.captureException(e, {
          extra: logData
        });
      }

      console.error("Date formatting error:", logData);

      return this.translateService.instant("Invalid date");
    }
  }

  todayISODate() {
    // Returns today's date in YYYY-MM-DD format.
    return new Date().toISOString().split("T")[0];
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  humanizeMonth(month: Month): string {
    const map = {
      [Month.JAN]: this.translateService.instant("January"),
      [Month.FEB]: this.translateService.instant("February"),
      [Month.MAR]: this.translateService.instant("March"),
      [Month.APR]: this.translateService.instant("April"),
      [Month.MAY]: this.translateService.instant("May"),
      [Month.JUN]: this.translateService.instant("June"),
      [Month.JUL]: this.translateService.instant("July"),
      [Month.AUG]: this.translateService.instant("August"),
      [Month.SEP]: this.translateService.instant("September"),
      [Month.OCT]: this.translateService.instant("October"),
      [Month.NOV]: this.translateService.instant("November"),
      [Month.DEC]: this.translateService.instant("December")
    };

    return map[month];
  }

  formatDates(dates: string[]): string {
    if (dates.length === 0) {
      return "";
    }

    // Convert dates to timestamps, filter out nulls and invalid dates, remove duplicates, and remove different times on the same day
    const parsedDates = Array.from(
      new Set(
        dates
          .filter(dateStr => dateStr && !isNaN(Date.parse(dateStr)))
          .map(dateStr => new Date(new Date(dateStr).toISOString().split("T")[0]).getTime())
      )
    ).sort((a, b) => a - b);

    // If the array is empty after filtering, return an empty string
    if (parsedDates.length === 0) {
      return "";
    }

    if (parsedDates.length === 1) {
      return this.formatSingleDate(parsedDates[0]);
    }

    const contiguousRanges = this.getContiguousRanges(parsedDates);

    if (parsedDates.length === 2 && contiguousRanges.length === 2) {
      const date1 = new Date(parsedDates[0]);
      const date2 = new Date(parsedDates[1]);
      const currentYear = this.getCurrentYear();

      // If dates are in the same year but not current year, format differently
      if (date1.getFullYear() === date2.getFullYear() && date1.getFullYear() !== currentYear) {
        const dateFormat = this.getDateFormat();
        return `${this.datePipeTransform(date1, dateFormat)}, ${this.datePipeTransform(date2, dateFormat)} ${date1.getFullYear()}`;
      }

      return `${this.formatSingleDate(parsedDates[0])}, ${this.formatSingleDate(parsedDates[1])}`;
    }

    if (contiguousRanges.length === 1) {
      const range = contiguousRanges[0];
      if (range.length === 1) {
        return this.formatSingleDate(range[0]);
      }
      return this.formatRange(range);
    }

    return this.formatNonContiguous(parsedDates);
  }

  public getContiguousRanges(dates: number[]): number[][] {
    const ranges: number[][] = [];
    let currentRange: number[] = [dates[0]];

    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currentDate = dates[i];

      const oneDay = 24 * 60 * 60 * 1000;

      if (currentDate - prevDate <= oneDay) {
        currentRange.push(currentDate);
      } else {
        ranges.push(currentRange);
        currentRange = [currentDate];
      }
    }

    ranges.push(currentRange);

    return ranges;
  }

  private getDateFormat(): string {
    return this.translateService.currentLang === "en-US" ? "MMM d" : "d MMM";
  }

  private formatSingleDate(date: number, forceYear = false): string {
    const dateObj = new Date(date);

    const currentYear = this.getCurrentYear();
    const dateFormat = this.getDateFormat();
    const currentLang = this.translateService.currentLang;

    if (dateObj.getFullYear() === currentYear && !forceYear) {
      return this.datePipeTransform(dateObj, dateFormat, "UTC", currentLang);
    }

    const format = `${dateFormat}${dateFormat === "MMM d" ? "," : ""} yyyy`;
    return this.datePipeTransform(dateObj, format, "UTC", currentLang);
  }

  private formatRange(range: number[]): string {
    const startDate = new Date(range[0]);
    const endDate = new Date(range[range.length - 1]);
    const currentYear = this.getCurrentYear();
    const dateFormat = this.getDateFormat();

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startYear !== endYear) {
      // If the range spans different years, show the year for both dates
      return `${this.formatSingleDate(range[0])} - ${this.formatSingleDate(range[range.length - 1], startYear !== currentYear)}`;
    }

    if (startYear === currentYear) {
      // If the range is within the current year, omit the year
      if (startDate.getMonth() !== endDate.getMonth()) {
        return `${this.datePipeTransform(startDate, dateFormat)} - ${this.datePipeTransform(endDate, dateFormat)}`;
      }

      if (dateFormat === "MMM d") {
        return `${this.datePipeTransform(endDate, "MMM")} ${this.datePipeTransform(startDate, "d")}-${this.datePipeTransform(endDate, "d")}`;
      }

      return `${this.datePipeTransform(startDate, "d")}-${this.datePipeTransform(endDate, dateFormat)}`;
    }

    // If the range is within the same year (but not the current year), include the year once at the end
    if (startDate.getMonth() !== endDate.getMonth()) {
      if (dateFormat === "MMM d") {
        return `${this.datePipeTransform(startDate, "MMM d")} - ${this.datePipeTransform(endDate, "MMM d, yyyy")}`;
      }
      return `${this.datePipeTransform(startDate, dateFormat)} - ${this.datePipeTransform(endDate, dateFormat + " yyyy")}`;
    }

    if (dateFormat === "MMM d") {
      return `${this.datePipeTransform(startDate, "MMM d")}-${this.datePipeTransform(endDate, "d, yyyy")}`;
    }

    return `${this.datePipeTransform(startDate, "d")}-${this.datePipeTransform(endDate, dateFormat + " yyyy")}`;
  }

  private formatNonContiguous(dates: number[]): string {
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    const dateFormat = this.getDateFormat();

    const allInSameYear = firstDate.getFullYear() === lastDate.getFullYear();
    const allInSameMonth = allInSameYear && firstDate.getMonth() === lastDate.getMonth();

    if (allInSameMonth) {
      return `${dates.length} days in ${this.datePipeTransform(firstDate, "MMM yyyy")}`;
    }

    if (allInSameYear) {
      return `${dates.length} days in ${this.datePipeTransform(firstDate, "yyyy")}`;
    }

    return `${dates.length} days`;
  }
}
