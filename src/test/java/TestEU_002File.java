import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;

public class TestEU_002File {
    WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException {
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try {
            By extract_name = By.linkText("Extract Data");
            WebElement extract_button = wait.until(ExpectedConditions.visibilityOfElementLocated(extract_name));
            extract_button.click();
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));

            By pattern_before_input = By.id("pattern_before");
            driver.findElement(pattern_before_input).sendKeys("Table 5");
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_after_input).sendKeys("Table 6");
            Thread.sleep(2000);
            By search_id = By.id("regex-search");
            WebElement search_button = wait.until(ExpectedConditions.visibilityOfElementLocated(search_id));
            search_button.click();
            Thread.sleep(4000);
            By clear_id = By.id("clear-all-selections");
            WebElement clear_button = wait.until(ExpectedConditions.visibilityOfElementLocated(clear_id));
            clear_button.click(); //clear results
            Thread.sleep(3000);
            driver.findElement(pattern_before_input).sendKeys("Table 5");
            By include_pattern_before_id = By.id("include_pattern_before");
            WebElement include_pattern_bbox = wait.until(ExpectedConditions.visibilityOfElementLocated(include_pattern_before_id));
            include_pattern_bbox.click();
            driver.findElement(pattern_after_input).sendKeys("Table 6");
            Thread.sleep(4000);
            WebElement search_button2 = wait.until(ExpectedConditions.visibilityOfElementLocated(search_id));
            search_button2.click();
            Thread.sleep(3000);





        } catch (Exception e) {
            System.out.print(e);
        }
    }
    @After
    public void TearDown(){
        driver.quit();
    }}
