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

public class TestCurriculumExcelGenerator {

    @Test
    public void generateTestExcelFiles() throws IOException {
        Path targetDir = Paths.get("..", "test_materials").toAbsolutePath().normalize();
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        // File 1: Standard 6 columns (Audio is left for AI TTS or manual upload)
        Path file1 = targetDir.resolve("bai_hoc_tu_vung_moi.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(file1.toFile())) {
            Sheet sheet = wb.createSheet("Từ Vựng Mới");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt", "Câu ví dụ", "Dịch câu ví dụ"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                {"宇航员", "yǔhángyuán", "Vũ Hàng Viên", "Phi hành gia, nhà du hành vũ trụ", "他从小就梦想成为一名宇航员。", "Từ nhỏ anh ấy đã mơ ước trở thành một phi hành gia."},
                {"冰淇淋", "bīngqílín", "Băng Kỳ Lâm", "Kem, kem que", "夏天的下午吃冰淇淋真舒服。", "Buổi chiều mùa hè ăn kem thật sảng khoái."},
                {"区块链", "qūkuàiliàn", "Khu Khối Liên", "Công nghệ chuỗi khối, blockchain", "区块链技术具有去中心化的特点。", "Công nghệ blockchain có đặc điểm phi tập trung."}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated File 1: " + file1);
        }

        // File 2: 7 columns including Audio column
        Path file2 = targetDir.resolve("bai_hoc_tu_vung_moi_co_audio.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(file2.toFile())) {
            Sheet sheet = wb.createSheet("Từ Vựng Mới Có Audio");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt", "Câu ví dụ", "Dịch câu ví dụ", "Âm thanh"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                {"宇航员", "yǔhángyuán", "Vũ Hàng Viên", "Phi hành gia, nhà du hành vũ trụ", "他从小就梦想成为一名宇航员。", "Từ nhỏ anh ấy đã mơ ước trở thành một phi hành gia.", "/assets/audio/custom/yuhangyuan.mp3"},
                {"冰淇淋", "bīngqílín", "Băng Kỳ Lâm", "Kem, kem que", "夏天的下午吃冰淇淋真舒服。", "Buổi chiều mùa hè ăn kem thật sảng khoái.", "/assets/audio/custom/bingqilin.mp3"},
                {"区块链", "qūkuàiliàn", "Khu Khối Liên", "Công nghệ chuỗi khối, blockchain", "区块链技术具有去中心化的特点。", "Công nghệ blockchain có đặc điểm phi tập trung.", "/assets/audio/custom/qukuailian.mp3"}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated File 2: " + file2);
        }

        // File 3: Presentation Demo Set - 6 columns (Standard AI & Clean Energy)
        Path file3 = targetDir.resolve("bai_hoc_cong_nghe_40.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(file3.toFile())) {
            Sheet sheet = wb.createSheet("CongNghe4.0");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt", "Câu ví dụ", "Dịch câu ví dụ"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                {"人工智能", "réngōng zhìnéng", "Nhân Công Trí Năng", "Trí tuệ nhân tạo (AI)", "人工智能正在深刻改变人类的生活方式。", "Trí tuệ nhân tạo đang làm thay đổi sâu sắc lối sống của nhân loại."},
                {"智能手机", "zhìnéng shǒujī", "Trí Năng Thủ Cơ", "Điện thoại thông minh (Smartphone)", "现代人的日常工作离不开智能手机。", "Công việc hàng ngày của người hiện đại không thể thiếu chiếc điện thoại thông minh."},
                {"新能源", "xīn néngyuán", "Tân Năng Nguyên", "Năng lượng mới, năng lượng xanh", "发展新能源汽车有助于实现绿色减排。", "Phát triển xe năng lượng mới góp phần đạt được mục tiêu giảm phát thải xanh."}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated File 3: " + file3);
        }

        // File 4: Presentation Demo Set - 7 columns with Audio URL
        Path file4 = targetDir.resolve("bai_hoc_cong_nghe_40_co_audio.xlsx");
        try (Workbook wb = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(file4.toFile())) {
            Sheet sheet = wb.createSheet("CongNghe4.0CoAudio");

            String[] headers = {"Chữ Hán", "Pinyin", "Hán-Việt", "Nghĩa tiếng Việt", "Câu ví dụ", "Dịch câu ví dụ", "Âm thanh"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            String[][] rows = {
                {"人工智能", "réngōng zhìnéng", "Nhân Công Trí Năng", "Trí tuệ nhân tạo (AI)", "人工智能正在深刻改变人类的生活方式。", "Trí tuệ nhân tạo đang làm thay đổi sâu sắc lối sống của nhân loại.", "/assets/audio/custom/rengongzhineng.mp3"},
                {"智能手机", "zhìnéng shǒujī", "Trí Năng Thủ Cơ", "Điện thoại thông minh (Smartphone)", "现代人的日常工作离不开智能手机。", "Công việc hàng ngày của người hiện đại không thể thiếu chiếc điện thoại thông minh.", "/assets/audio/custom/zhinengshouji.mp3"},
                {"新能源", "xīn néngyuán", "Tân Năng Nguyên", "Năng lượng mới, năng lượng xanh", "发展新能源汽车有助于实现绿色减排。", "Phát triển xe năng lượng mới góp phần đạt được mục tiêu giảm phát thải xanh.", "/assets/audio/custom/xinnengyuan.mp3"}
            };

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(rows[r][c]);
                }
            }

            wb.write(fos);
            System.out.println("Generated File 4: " + file4);
        }
    }
}
