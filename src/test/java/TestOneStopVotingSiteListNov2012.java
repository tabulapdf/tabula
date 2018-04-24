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

//Test of the One_Stop_Voting_Site_List_Nov2012 pdf file.
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
    private void InclusiveButtons(boolean patternbefore, boolean patternafter){
        WebElement inclusive_before_btn = new WebDriverWait(driver, 30).until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_before"))));
        WebElement inclusive_after_btn = new WebDriverWait(driver, 30).until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_after"))));
        if (patternbefore){
            inclusive_before_btn.click();
        }

        if(patternafter){
            inclusive_after_btn.click();
        }
    }
    private void UploadPDF() throws InterruptedException {
        String filePath = "/home/slmendez/484_P7_1-GUI/src/test/pdf/One_Stop_Voting_Site_List_Nov2012.pdf"; //
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(5000);
    }
    private void DeletePDF(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
    }
    @BeforeClass
    public static void SetUp() throws InterruptedException {
        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        //options.addArguments("headless");

        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();
    }
    @Test
    public void TestMultiPageTables() throws InterruptedException{
        try {
            UploadPDF();
            PageRefresh();

            //Test of regex input with inclusive for pattern before for a table of 2 pages in length
            PatternInputStrings("JEFFERSON", "BRUNSWICK");
            WebElement inclusive_before_btn = driver.findElement(By.id("include_pattern_before"));
            inclusive_before_btn.click();
            ClickRegexButton();
            Thread.sleep(1500);
            //Confirm a result shows up in the regex search table
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            PreviewandExportDatapg();
            Thread.sleep(1200);
            //verify data extraction
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'JEFFERSON')]")).getText();
            Boolean regex_data;
            if (result_data.equals("JEFFERSON, NC 28640")) {
                regex_data = true;
            } else {
                regex_data = false;
            }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'DUBLIN')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("DUBLIN, NC 28332")) {
                regex_data2 = true;
            } else {
                regex_data2 = false;
            }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) {
                final_results = true;
            } else {
                final_results = false;
            }
            assertTrue("Failed, regex found no match for inclusive input for pattern before for a 2 page length table"
                    , final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Test of regex input with inclusive for pattern after for a table of 5 pages in length
            PatternInputStrings("CHEROKEE", "CUMBERLAND");
            ClickRegexButton();
            Thread.sleep(1500);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if (result3.equals("1")) {
                regex_result3 = true;
            } //if true, there are zero matches
            else {
                regex_result3 = false;
            }
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CHEROKEE')]")).getText();
            Boolean regex_data5;
            if (result_data5.equals("CHEROKEE COUNTY BOARD OF ELECTIONS OFFICE")) {
                regex_data5 = true;
            } else {
                regex_data5 = false;
            }
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'CUMBERLAND')]")).getText();
            Boolean regex_data6;
            if (result_data6.equals("CUMBERLAND")) {
                regex_data6 = true;
            } else {
                regex_data6 = false;
            }
            Boolean final_results3;
            if (regex_result3 && regex_data5 && regex_data6) {
                final_results3 = true;
            } else {
                final_results3 = false;
            }
            assertTrue("Failed, Tabula found no match for a multi page table spanning more than 2 pages", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void MultiRegexResults(){

    }
    @Test
    public void TestMultiCombinationRegexSearches(){

    }
    @Test
    public void TestOverlapRegexSearch(){

    }
    @Test
    public void TestImage(){

    }
    @Test
    public void TestFooterandHeaderwithRegex(){

    }
    @AfterClass
    public static void TearDown(){
        driver.quit();
    }
}
