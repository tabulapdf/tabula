import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

public class TestImageBasedPDFs {
    private WebDriver driver;
    private String Tabula_url = "http://127.0.0.1:9292/";

    @Before
    public void Setup() {
        System.setProperty("webdriver.chrome.driver", "/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();

    }
    @Test
    public void Test4BuckCAPPart2PDF(){
        try {
            WebDriverWait wait = new WebDriverWait(driver, 500);
            String filePath = System.getProperty("user.dir") + "/src/test/pdf/4._Buck_CAP_Part_2_Appx_A_partial.pdf";
            WebElement chooseFile = driver.findElement(By.id("file"));
            chooseFile.sendKeys(filePath);
            WebElement import_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("import_file"))));
            import_btn.click();
            Thread.sleep(15000);
            driver.manage().timeouts().pageLoadTimeout(1500, TimeUnit.SECONDS);
            driver.switchTo().alert().accept(); //accept error pop-up window
            Thread.sleep(1000);
        }
        catch (Exception e){}
    }
    @Test
    public void TestAllenCSAtablePDF(){
        try {
            WebDriverWait wait = new WebDriverWait(driver, 500);
            String filePath = System.getProperty("user.dir") + "/src/test/pdf/Allen_CSA_table_6-9_gradients.pdf";
            WebElement chooseFile = driver.findElement(By.id("file"));
            chooseFile.sendKeys(filePath);
            WebElement import_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("import_file"))));
            import_btn.click();
            Thread.sleep(15000);
            driver.manage().timeouts().pageLoadTimeout(1500, TimeUnit.SECONDS);
            driver.switchTo().alert().accept(); //accept error pop-up window
            Thread.sleep(1000);
        }
        catch(Exception e){}
    }
    @Test
    public void TestCliffsidePDF(){
        try {
            WebDriverWait wait = new WebDriverWait(driver, 500);

            String filePath = System.getProperty("user.dir") + "/src/test/pdf/Cliffside_CSA_Report_NCDENR_Submittal.pdf";
            WebElement chooseFile = driver.findElement(By.id("file"));
            chooseFile.sendKeys(filePath);
            WebElement import_btn = wait.until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("import_file"))));
            import_btn.click();
            Thread.sleep(15000);
            driver.manage().timeouts().pageLoadTimeout(1500, TimeUnit.SECONDS);
            driver.switchTo().alert().accept(); //accept error pop-up window
            Thread.sleep(1000);
        }
        catch(Exception e){}
    }
    @After
    public void TearDown(){
        //navigates back and deletes the pdf utilized
        driver.quit();
    }
}
