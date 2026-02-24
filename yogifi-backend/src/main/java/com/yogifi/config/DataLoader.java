package com.yogifi.config;

import com.yogifi.model.Pose;
import com.yogifi.repository.PoseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final PoseRepository poseRepository;

    // Bump this when you add/change poses so the DB is re-seeded automatically.
    private static final int EXPECTED_POSE_COUNT = 5;

    @Override
    @Transactional
    public void run(String... args) {
        long current = poseRepository.count();
        if (current == EXPECTED_POSE_COUNT) {
            log.info("Pose data up-to-date ({} poses). Skipping seed.", current);
            return;
        }
        log.info("Re-seeding poses (found {}, expected {})...", current, EXPECTED_POSE_COUNT);
        poseRepository.deleteAll();
        loadPoses();
        log.info("Seeded {} ML-ready poses.", poseRepository.count());
    }

    private void loadPoses() {
        List<Pose> poses = List.of(

            Pose.builder()
                .name("Downward Dog")
                .sanskritName("Adho Mukha Svanasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .mlModelKey("downdog")
                .imageUrl("/poses/downdog.jpg")
                .description("One of the most iconic yoga poses. Forms an inverted V-shape that stretches and strengthens the entire body.")
                .instructions("1. Start on hands and knees\n2. Spread fingers wide, press firmly into palms\n3. Tuck toes and lift knees off the floor\n4. Straighten legs and lift hips up and back\n5. Create an inverted V-shape with your body\n6. Press heels gently toward the floor\n7. Relax head between upper arms, gaze toward navel")
                .benefits("Calms the brain, relieves stress and mild depression. Energizes the body. Stretches shoulders, hamstrings, calves, arches, and hands. Strengthens arms and legs. Helps relieve back pain.")
                .precautions("Avoid if you have carpal tunnel syndrome, are in late-term pregnancy, or have high blood pressure or headache.")
                .targetDurationSeconds(45)
                .build(),

            Pose.builder()
                .name("Goddess Pose")
                .sanskritName("Utkata Konasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .mlModelKey("goddess")
                .imageUrl("/poses/goddess.jpg")
                .description("A powerful wide-legged squat that opens the hips and builds strength in the legs and core.")
                .instructions("1. Stand with feet wide apart (about 3 feet)\n2. Turn toes out 45 degrees\n3. Bend knees deeply, lowering hips toward knee height\n4. Keep knees tracking over toes\n5. Raise arms to shoulder height, bend elbows 90°, palms facing forward\n6. Draw shoulders down, lengthen spine\n7. Engage core and hold")
                .benefits("Strengthens thighs, calves, and ankles. Opens hips and chest. Stimulates the cardiovascular system. Builds heat and stamina.")
                .precautions("Avoid deep squatting if you have knee or hip injuries. Keep the spine upright to protect the lower back.")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Plank Pose")
                .sanskritName("Phalakasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .mlModelKey("plank")
                .imageUrl("/poses/plank.jpg")
                .description("A foundational core-strengthening pose that builds full-body stability and prepares you for arm balances.")
                .instructions("1. Start in push-up position with arms straight\n2. Place hands directly under shoulders\n3. Form a straight line from head to heels\n4. Engage core by drawing navel toward spine\n5. Press into palms, spread fingers wide\n6. Keep hips level — don't sag or pike\n7. Gaze slightly forward, neck in line with spine")
                .benefits("Strengthens arms, wrists, and spine. Tones the abdomen. Builds core stability. Prepares the body for more challenging arm balances.")
                .precautions("Avoid if you have carpal tunnel syndrome. Modify on forearms if wrists are sensitive.")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Tree Pose")
                .sanskritName("Vrksasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .mlModelKey("tree")
                .imageUrl("/poses/tree.jpg")
                .description("A balancing pose that improves focus and concentration while strengthening the standing leg and opening the hip.")
                .instructions("1. Stand on your left leg, rooting down through all four corners of the foot\n2. Bend your right knee and place right foot on inner left thigh or calf (never the knee)\n3. Press foot and leg into each other to create stability\n4. Bring palms together at heart center\n5. Fix your gaze (drishti) on a still point for balance\n6. Optionally raise arms overhead like branches\n7. Hold, then switch sides")
                .benefits("Strengthens thighs, calves, ankles, and spine. Stretches the groins and inner thighs. Improves sense of balance and focus.")
                .precautions("If you have low blood pressure or headache, don't raise arms overhead. Use a wall for support while learning.")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Warrior II")
                .sanskritName("Virabhadrasana II")
                .difficulty(Pose.Difficulty.BEGINNER)
                .mlModelKey("warrior2")
                .imageUrl("/poses/warrior2.jpg")
                .description("A powerful standing pose that builds strength and stamina while opening the hips and chest.")
                .instructions("1. Stand with feet 3–4 feet apart\n2. Turn right foot out 90°, left foot slightly in\n3. Raise arms parallel to the floor, palms facing down\n4. Bend right knee directly over the right ankle\n5. Keep torso upright and centered, shoulders over hips\n6. Turn head to gaze over right fingertips\n7. Hold, then repeat on the other side")
                .benefits("Strengthens and stretches legs and ankles. Stretches the groins, chest, and shoulders. Stimulates abdominal organs. Increases stamina and endurance.")
                .precautions("If you have high blood pressure or neck problems, look straight ahead rather than turning the head.")
                .targetDurationSeconds(30)
                .build()
        );

        poseRepository.saveAll(poses);
    }
}
