package com.elearning;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Utility test to generate authentic .xlsx test fixtures for Postman / Newman automation.
 */
public class ExcelFixtureGenerator {

    @Test
    public void generateFixtures() throws IOException {
        Path fixturesDir = Paths.get("..", "tests", "postman", "fixtures").toAbsolutePath().normalize();
        if (!Files.exists(fixturesDir)) {
            Files.createDirectories(fixturesDir);
        }

        // 1. Valid curriculum workbook
        Path validPath = fixturesDir.resolve("sample-curriculum-valid.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(validPath.toFile())) {
            Sheet sheet = wb.createSheet("Vocabularies");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt", "Câu ví dụ", "Dịch câu ví dụ"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                    {"学", "xué", "Học", "Học tập, học hỏi", "他在学校学汉语。", "Anh ấy học tiếng Trung ở trường."},
                    {"生", "shēng", "Sinh", "Sinh ra, học sinh", "我是学生。", "Tôi là học sinh."},
                    {"大", "dà", "Đại", "Lớn, to lớn", "这个苹果很大。", "Quả táo này rất to."},
                    {"小", "xiǎo", "Tiểu", "Nhỏ, bé", "这只猫很小。", "Con mèo này rất nhỏ."},
                    {"多", "duō", "Đa", "Nhiều", "这里的书很多。", "Sách ở đây rất nhiều."}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated: " + validPath);
        }

        // 2. Invalid curriculum workbook (rows with missing required fields)
        Path invalidPath = fixturesDir.resolve("sample-curriculum-invalid.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(invalidPath.toFile())) {
            Sheet sheet = wb.createSheet("Vocabularies");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                    {"", "", "", ""},
                    {"好", "", "Hảo", ""}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated: " + invalidPath);
        }

        // 3. Bad headers workbook
        Path badHeadersPath = fixturesDir.resolve("sample-curriculum-bad-headers.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(badHeadersPath.toFile())) {
            Sheet sheet = wb.createSheet("Sheet1");

            String[] headers = {"Cột 1", "Cột 2", "Cột 3"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            wb.write(fos);
            System.out.println("Generated: " + badHeadersPath);
        }
    }
}
