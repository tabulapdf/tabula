
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
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

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
        Thread.sleep(600);
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
        driver = new ChromeDriver();
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
    public void TestMultiPageTables() throws InterruptedException{
        //multiple page table (2)
        //multiple page table (5)
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
