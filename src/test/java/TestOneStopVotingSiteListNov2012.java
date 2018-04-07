
//Test of the One_Stop_Voting_Site_List_Nov2012 pdf file.
// TODO: currently, I do not know how to directly call a pdf file so I can use it for the test cases without manually
//  using the windows explorer to retrieve it. For now, the pdf will be preloaded onto Tabula for testing.

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import static junit.framework.TestCase.assertTrue;

public class TestOneStopVotingSiteListNov2012 {
    private static WebDriver driver;
    private static String Tabula_url = "http://127.0.0.1:9292/";
    private WebDriverWait wait = new WebDriverWait(driver, 100);

    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    private void PreviewandExportDatapg(){
        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id));
        previewandexport_button.click();
    }
    private void ClickRegexButton() throws InterruptedException {
        By regex_search_id = By.id("regex-search");
        WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id));
        regex_button.click();
        Thread.sleep(500);
    }
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);
    }
    @BeforeClass
    public static void SetUp() throws InterruptedException {
        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");

        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();
        String filePath = "/home/slmendez/484_P7_1-GUI/src/test/pdf/One_Stop_Voting_Site_List_Nov2012.pdf"; //
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(700);
    }
    @Test
    public void TestInclusiveInputsforPatternBeforeandPatternAfter() throws InterruptedException{
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Tests for inclusive for pattern before and non-inclusive for pattern after
            PatternInputStrings("ALAMANCE","ALEXANDER");
            WebElement inclusive_before_btn = driver.findElement(By.id("include_pattern_before"));
            inclusive_before_btn.click();
            ClickRegexButton();
            Thread.sleep(1500);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'ALAMANCE')]")).getText();
            Boolean regex_data;
            if(result_data.equals("ALAMANCE")){ regex_data = true;}
            else{ regex_data = false;}
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'MEBANE,')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("MEBANE, NC 27302")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, regex found no match for inclusive for pattern before and non-inclusive for " +
                    "pattern after", final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for non-inclusive for pattern before and inclusive for pattern after
            PatternInputStrings("ALAMANCE", "ALEXANDER");
            WebElement inclusive_after_btn2 = driver.findElement(By.id("include_pattern_after"));
            inclusive_after_btn2.click();
            ClickRegexButton();
            Thread.sleep(1500);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result2.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Monday, October')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("Monday, October 22 - Friday, October 26 8:00 a.m. - 5:00 p.m.")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'ALEXANDER')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("ALEXANDER")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result3 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, regex found no match for inclusive for pattern after and non-inclusive for " +
                    "pattern before", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for inclusive for pattern before and for pattern after
            PatternInputStrings("ALAMANCE","ALEXANDER");
            WebElement inclusive_before_btn3 = driver.findElement(By.id("include_pattern_before"));
            inclusive_before_btn3.click();
            WebElement inclusive_after_btn3 = driver.findElement(By.id("include_pattern_after"));
            inclusive_after_btn3.click();
            ClickRegexButton();
            Thread.sleep(1500);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result4;
            if(result3.equals("1")){ regex_result4 = true;} //if true, there are zero matches
            else{ regex_result4 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'ALAMANCE')]")).getText();
            System.out.print(result_data5);
            Boolean regex_data5;
            if(result_data5.equals("ALAMANCE")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'ALEXANDER')]")).getText();
            System.out.print(result_data6);
            Boolean regex_data6;
            if(result_data6.equals("ALEXANDER")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result4 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, regex found no match for inclusive for pattern after and inclusive for " +
                    "pattern before", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestMultiPageTables() throws InterruptedException{
        //navigates to the extraction page and checks that it is in the extraction page
        WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
        extract_button.click();
        PageRefresh();

        //Test of regex input with inclusive for pattern before for a table of 2 pages in length
        PatternInputStrings("JEFFERSON","BRUNSWICK");
        WebElement inclusive_before_btn = driver.findElement(By.id("include_pattern_before"));
        inclusive_before_btn.click();
        ClickRegexButton();
        Thread.sleep(1500);
        //Confirm a result shows up in the regex search table
        String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
        Boolean regex_result;
        if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
        else{ regex_result = false;}
        PreviewandExportDatapg();
        Thread.sleep(1200);
        //verify data extraction
        String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                "'JEFFERSON')]")).getText();
        Boolean regex_data;
        if(result_data.equals("JEFFERSON, NC 28640")){ regex_data = true;}
        else{ regex_data = false;}
        String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'DUBLIN')]")).getText();
        Boolean regex_data2;
        if(result_data2.equals("DUBLIN, NC 28332")){ regex_data2 = true;}
        else{ regex_data2 = false;}
        Boolean final_results;
        if(regex_result && regex_data && regex_data2){ final_results = true;}
        else{final_results = false;}
        assertTrue("Failed, regex found no match for inclusive input for pattern before for a 2 page length table"
                , final_results);
        driver.navigate().refresh();
        PageRefresh();

        //Test of regex input with inclusive for pattern after for a table of 5 pages in length
        PatternInputStrings("CHEROKEE","CUMBERLAND");
        ClickRegexButton();
        Thread.sleep(1500);
        String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
        Boolean regex_result3;
        if(result3.equals("1")){ regex_result3 = true;} //if true, there are zero matches
        else{ regex_result3 = false;}
        PreviewandExportDatapg();
        Thread.sleep(600);
        String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CHEROKEE')]")).getText();
        Boolean regex_data5;
        if(result_data5.equals("CHEROKEE COUNTY BOARD OF ELECTIONS OFFICE")){ regex_data5 = true;}
        else{ regex_data5 = false;}
        String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CUMBERLAND')]")).getText();
        Boolean regex_data6;
        if(result_data6.equals("CUMBERLAND")){ regex_data6 = true;}
        else{ regex_data6 = false;}
        Boolean final_results3;
        if(regex_result3 && regex_data5 && regex_data6){ final_results3 = true;}
        else{final_results3 = false;}
        assertTrue("Failed, Tabula found no match for a multi page table spanning more than 2 pages", final_results3);

        driver.navigate().back();
        driver.navigate().back();
        Thread.sleep(500);
    }
    @Test
    public void TestOverlappingTables() throws InterruptedException{
        //overlapping tables (multi page, within the same page, within more than > 5 pages)
    }
    @Test
    public void TestDuplicateSearches() throws InterruptedException{
        //duplicate search
    }
    @AfterClass
    public static void TearDown(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
        driver.quit();
    }
}
